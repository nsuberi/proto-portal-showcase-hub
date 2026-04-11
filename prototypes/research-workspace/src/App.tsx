import { BrowserRouter, Routes, Route } from "react-router-dom";
import GalleryPage from "./pages/GalleryPage";
import ContentDetailPage from "./pages/ContentDetailPage";
import WorkspaceLayout from "./components/layout/WorkspaceLayout";

export default function App() {
  return (
    <BrowserRouter basename="/prototypes/research-workspace">
      <Routes>
        <Route path="/" element={<GalleryPage />} />
        <Route path="/content/:id" element={<ContentDetailPage />} />
        <Route path="/workspace" element={<WorkspaceLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
