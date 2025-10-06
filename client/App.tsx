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
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '14px',
            fontFamily: 'var(--font-sans)',
          },
          className: 'sonner-toast',
        }}
      />
    </>
  );
};

export default App;
