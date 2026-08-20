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
import EditLinePage from "@/pages/EditorPage/EditLinePage/EditLinePage";

import Profile from "@/pages/Profile/Profile";

import {
  registerAIListener
} from "@/listener/ai.listener";


export default function App() {


  useEffect(() => {

    const cleanup =
      registerAIListener();

    return cleanup;

  }, []);


  return (

    <MainLayout>

      <Routes>


        {/* ==========================================
            HOME
        ========================================== */}

        <Route
          path="/"
          element={
            <HomePage />
          }
        />


        {/* ==========================================
            PROCESSING
        ========================================== */}

        <Route
          path="/processing"
          element={
            <ProcessingPage />
          }
        />


        {/* ==========================================
            EDITOR - LINES
        ========================================== */}

        <Route
          path="/editor/lines"
          element={
            <EditLinePage />
          }
        />


        {/* ==========================================
            EDITOR
        ========================================== */}

        <Route
          path="/editor"
          element={
            <EditorPage />
          }
        />


        {/* ==========================================
            PROFILE
        ========================================== */}

        <Route
          path="/profile"
          element={
            <Profile />
          }
        />


      </Routes>

    </MainLayout>

  );

}