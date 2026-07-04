import { BrowserRouter, Routes, Route } from "react-router-dom";
import GalleryPage from "./pages/GalleryPage";
import ContentDetailPage from "./pages/ContentDetailPage";
import WorkspaceLayout from "./components/layout/WorkspaceLayout";
import SecurityPage from "./pages/SecurityPage";
import BackendGate from "./components/BackendGate";
import { ChatProvider } from "./contexts/ChatContext";
import { ConversationsProvider } from "./contexts/ConversationsContext";

export default function App() {
  return (
    <BrowserRouter basename="/prototypes/research-workspace">
      <Routes>
        <Route path="/" element={<GalleryPage />} />
        <Route path="/content/:id" element={<ContentDetailPage />} />
        <Route
          path="/workspace"
          element={
            <BackendGate>
              <ChatProvider>
                <ConversationsProvider>
                  <WorkspaceLayout />
                </ConversationsProvider>
              </ChatProvider>
            </BackendGate>
          }
        />
        <Route path="/security" element={<SecurityPage />} />
      </Routes>
    </BrowserRouter>
  );
}
