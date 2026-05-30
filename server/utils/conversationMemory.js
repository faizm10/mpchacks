const memory = new Map();

function getConversationContext(conversationId) {
  if (!conversationId) return null;
  return memory.get(conversationId) || null;
}

function setConversationContext(conversationId, context) {
  if (!conversationId) return;
  memory.set(conversationId, context);
}

module.exports = {
  getConversationContext,
  setConversationContext,
};
