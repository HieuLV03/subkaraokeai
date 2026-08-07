import {
  Routes,
  Route
} from "react-router-dom";

import {
  useEffect
} from "react";

import MainLayout from "@/layouts/MainLayout/MainLayout";

import HomePage from "@/pages/HomePages/HomePage";
import ProcessingPage from "@/pages/ProcessingPage/ProcessingPage";
import EditorPage from "@/pages/EditorPage/EditorPage";
import EditLinePage from "@/pages/EditorPage/EditLinePage/EditLinePage"; // ⭐ thêm

import {
  registerAIListener
} from "@/listener/ai.listener";

export default function App() {

useEffect(() => {

    const cleanup = registerAIListener();

    return cleanup;

}, []);
  return (

    <MainLayout>

      <Routes>

        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
          path="/processing"
          element={<ProcessingPage />}
        />

        {/* ⭐ Page chia dòng */}
        <Route
          path="/editor/lines"
          element={<EditLinePage />}
        />

        {/* Timing Editor (page hiện tại) */}
        <Route
          path="/editor"
          element={<EditorPage />}
        />

      </Routes>

    </MainLayout>

  );

}