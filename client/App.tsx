import React from "react";
import { ChatContainer } from "./components/chat/ChatContainer";
import { Toaster } from "sonner";

const App: React.FC = () => {
  return (
    <>
      <ChatContainer />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgb(31, 41, 55)',
            color: 'rgb(243, 244, 246)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '14px',
            fontFamily: 'var(--font-sans)',
          },
        }}
      />
    </>
  );
};

export default App;
