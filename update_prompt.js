const fs = require('fs');
const path = 'docs/afaq_v4_complete_workflow.json';
let wf = JSON.parse(fs.readFileSync(path, 'utf8'));

let promptNode = wf.nodes.find(n => n.name === 'Build AI Prompt');
promptNode.parameters.jsCode = promptNode.parameters.jsCode.replace(
  `  kbSection\n].join('\\n');`,
  `  kbSection,\n  '',\n  '--- MANDATORY INTENT TAG ---',\n  'At the VERY END of your message, on a new line, you MUST append exactly ONE of these tags:',\n  'Intent: general_inquiry (for questions)',\n  'Intent: order_placed (wants to buy, needs details)',\n  'Intent: address_provided (user gave address)',\n  'Intent: order_confirmed (user confirmed final order)',\n  'Intent: checkout_intent (asking how to pay)',\n  'Intent: human_handoff (user asked for human)',\n  'Example: [Your reply...] \\n\\nIntent: order_placed'\n].join('\\n');`
);

let msgNode = wf.nodes.find(n => n.name === 'Prepare Messages Body');
msgNode.parameters.jsCode = msgNode.parameters.jsCode.replace(
  `const messagesBody = JSON.stringify([\n  {\n    conversation_id:    conv_id,\n    sender_type:        'customer',\n    content:            ctx.normalized_message,\n    external_message_id: ctx.external_message_id,\n    detected_language:  ctx.detected_language,\n    is_read:            false\n  },\n  {\n    conversation_id:   conv_id,\n    sender_type:       'bot',\n    content:           ctx.ai_reply,\n    model_used:        ctx.model_used,\n    prompt_tokens:     ctx.prompt_tokens,\n    completion_tokens: ctx.completion_tokens,\n    latency_ms:        ctx.latency_ms,\n    kb_chunks_used:    ctx.kb_count || 0,\n    detected_language: ctx.detected_language,\n    is_read:           true\n  }\n]);`,
  `const messagesBody = JSON.stringify([\n  {\n    conversation_id:   conv_id,\n    sender_type:       'bot',\n    content:           ctx.ai_reply,\n    model_used:        ctx.model_used,\n    prompt_tokens:     ctx.prompt_tokens,\n    completion_tokens: ctx.completion_tokens,\n    latency_ms:        ctx.latency_ms,\n    kb_chunks_used:    ctx.kb_count || 0,\n    detected_language: ctx.detected_language,\n    is_read:           true\n  }\n]);`
);

fs.writeFileSync(path, JSON.stringify(wf, null, 2));
console.log('Done');
