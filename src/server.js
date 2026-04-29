import bolt from '@slack/bolt';
import { SupportClient } from './client.js';

const { App, ExpressReceiver } = bolt;

const env = (k, fallback) => {
  const v = process.env[k];
  if (!v && fallback === undefined) throw new Error(`Missing env: ${k}`);
  return v ?? fallback;
};

const support = new SupportClient({
  apiBaseUrl: env('SUPPORT_API_URL'),
  apiKey: env('SUPPORT_API_KEY'),
  appName: env('SUPPORT_APP_NAME', 'Slack'),
  identimeUserId: env('SUPPORT_IDENTIME_USER_ID', null),
});

const receiver = new ExpressReceiver({ signingSecret: env('SLACK_SIGNING_SECRET') });
const app = new App({
  token: env('SLACK_BOT_TOKEN'),
  receiver,
});

// /support [optional title] — open Block Kit modal pre-seeded.
app.command('/support', async ({ ack, body, client }) => {
  await ack();
  const [categories, priorities] = await Promise.all([
    safe(() => support.categories()),
    safe(() => support.priorities()),
  ]);
  await client.views.open({
    trigger_id: body.trigger_id,
    view: ticketModal({ initialTitle: body.text || '', categories, priorities }),
  });
});

// Modal submit handler.
app.view('ubiqui_support_ticket', async ({ ack, body, view, client }) => {
  const v = view.state.values;
  const title = v.title.title.value;
  const description = v.description.description.value;
  const categoryId = v.category?.category?.selected_option?.value || undefined;
  const priorityId = v.priority?.priority?.selected_option?.value || undefined;

  if (!title?.trim() || !description?.trim()) {
    await ack({
      response_action: 'errors',
      errors: { title: 'Title is required', description: 'Description is required' },
    });
    return;
  }

  await ack();

  try {
    const ticket = await support.createTicket(
      { title, description, categoryId, priorityId },
      {
        team: body.team?.domain,
        channel: body.view?.private_metadata,
        userId: body.user?.id,
        username: body.user?.name || body.user?.username,
      },
    );
    await client.chat.postMessage({
      channel: body.user.id,
      text: `Ticket created: *${title}*${ticket?.id ? ` (id ${ticket.id})` : ''}.`,
    });
  } catch (e) {
    await client.chat.postMessage({
      channel: body.user.id,
      text: `Could not create the ticket: ${e.message}`,
    });
  }
});

const ticketModal = ({ initialTitle, categories, priorities }) => ({
  type: 'modal',
  callback_id: 'ubiqui_support_ticket',
  title: { type: 'plain_text', text: 'Report an issue' },
  submit: { type: 'plain_text', text: 'Submit' },
  close: { type: 'plain_text', text: 'Cancel' },
  blocks: [
    {
      type: 'input',
      block_id: 'title',
      label: { type: 'plain_text', text: 'Short summary' },
      element: {
        type: 'plain_text_input',
        action_id: 'title',
        initial_value: initialTitle || undefined,
        max_length: 200,
      },
    },
    {
      type: 'input',
      block_id: 'description',
      label: { type: 'plain_text', text: 'What happened?' },
      element: {
        type: 'plain_text_input',
        action_id: 'description',
        multiline: true,
        max_length: 5000,
      },
    },
    ...(categories?.length ? [pickerBlock('category', 'Category', categories)] : []),
    ...(priorities?.length ? [pickerBlock('priority', 'Priority', priorities)] : []),
  ],
});

const pickerBlock = (key, label, options) => ({
  type: 'input',
  block_id: key,
  optional: true,
  label: { type: 'plain_text', text: label },
  element: {
    type: 'static_select',
    action_id: key,
    options: options.slice(0, 100).map((o) => ({
      text: { type: 'plain_text', text: o.name.slice(0, 75) || o.id },
      value: o.id,
    })),
  },
});

const safe = async (fn) => {
  try {
    return await fn();
  } catch {
    return [];
  }
};

const port = Number(env('PORT', '3000'));
await app.start(port);
console.log(`Ubiqui Support Slack app listening on :${port}`);
