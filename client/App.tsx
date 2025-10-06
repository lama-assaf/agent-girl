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
