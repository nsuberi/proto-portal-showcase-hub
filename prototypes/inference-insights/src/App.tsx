import { BrowserRouter, Routes, Route } from "react-router-dom";
import GalleryPage from "./pages/GalleryPage";
import InsightDetailPage from "./pages/InsightDetailPage";

export default function App() {
  return (
    <BrowserRouter basename="/prototypes/inference-insights">
      <Routes>
        <Route path="/" element={<GalleryPage />} />
        <Route path="/insight/:id" element={<InsightDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
