/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Set initial message
chatWindow.textContent = "👋 Hello! How can I help you today?";

// Track conversation history for multi-turn chat
let messages = [
  {
    role: "system",
    content:
      "You are a helpful assistant for L'Oréal. Only answer questions about L'Oréal products, routines, and recommendations. If asked about other brands or topics, politely decline and guide the user back to L'Oréal. Use a caring, professional, and empowering tone. Respond in 2–5 sentences, using clear, simple language. Never provide advice about non-L'Oréal products or topics. If the user shares their name, remember it and use it in future replies.",
  },
];

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get user's message from the input box
  const message = userInput.value.trim();
  if (!message) return;

  // Remove the initial greeting if it's still present
  if (
    chatWindow.textContent
      .trim()
      .startsWith("👋 Hello! How can I help you today?")
  ) {
    chatWindow.textContent = "";
  }

  // Add user's message to conversation history
  messages.push({ role: "user", content: message });

  // Show user's message in the chat window
  chatWindow.innerHTML += `<div class="msg user">${message}</div>`;

  // Clear the input bar after sending
  userInput.value = "";

  // Show a loading message while waiting for the AI response
  chatWindow.innerHTML += `<div class="msg ai">Thinking...</div>`;

  try {
    // Send the conversation history to the Cloudflare worker API
    console.log("Sending messages to worker:", messages);
    const response = await fetch(
      "https://loreal-worker.jkguzman.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
      }
    );
    console.log("Worker response status:", response.status);

    // Get the response data as JSON
    let data;
    try {
      data = await response.json();
      console.log("Worker response JSON:", data);
    } catch (jsonError) {
      console.error("Failed to parse JSON:", jsonError);
      chatWindow.innerHTML += `<div class="msg ai">Sorry, invalid response from server.</div>`;
      return;
    }

    // Remove the loading message
    const msgs = chatWindow.querySelectorAll(".msg.ai");
    if (msgs.length) msgs[msgs.length - 1].remove();

    // Show the AI's reply in the chat window
    if (data && data.choices && data.choices.length > 0) {
      chatWindow.innerHTML += `<div class="msg ai">${data.choices[0].message.content}</div>`;
      // Add assistant's reply to conversation history
      messages.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });
    } else {
      console.warn("No reply in worker response:", data);
      chatWindow.innerHTML += `<div class="msg ai">Sorry, I couldn't get a response."</div>`;
    }
  } catch (error) {
    // Remove the loading message
    const msgs = chatWindow.querySelectorAll(".msg.ai");
    if (msgs.length) msgs[msgs.length - 1].remove();

    // Show an error message if something goes wrong
    console.error("Fetch error:", error);
    chatWindow.innerHTML += `<div class="msg ai">Sorry, something went wrong."</div>`;
  }
});
