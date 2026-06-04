import ChatHistory from "../models/ChatHistory.js";

export async function getChatHistory(req, res) {
  try {
    const chats = await ChatHistory.find()
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      data: chats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}