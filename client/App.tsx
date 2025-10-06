import React, { useEffect } from "react";
import { ChatContainer } from "./components/chat/ChatContainer";
import { Toaster } from "sonner";

const App: React.FC = () => {
  // Preload the agent icon to prevent broken image on first render
  useEffect(() => {
    const img = new Image();
    img.src = '/client/agent-boy.svg';
  }, []);

  return (
    <>
      <ChatContainer />
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'sonner-toast',
          style: {
            fontSize: '14px',
            fontFamily: 'var(--font-sans)',
          },
        }}
      />
    </>
  );
};

export default App;
