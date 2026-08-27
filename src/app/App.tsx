import {
  Routes,
  Route
} from "react-router-dom";

import {
  useEffect
} from "react";

import MainLayout from "@/layouts/MainLayout/MainLayout";

import HomePage from "@/pages/HomePages/HomePage";
import ProjectPage from "@/pages/ProjectPage/ProjectPage";
import ProcessingPage from "@/pages/ProcessingPage/ProcessingPage";
import EditorPage from "@/pages/EditorPage/EditorPage";
import EditLinePage from "@/pages/EditorPage/EditLinePage/EditLinePage";
import Profile from "@/pages/Profile/Profile";

import ModalUpdate from "@/components/UpdateModal/UpdateModal";

import {
  registerAIListener
} from "@/listener/ai.listener";
import NewProjectPage from "@/pages/NewProjectPage/NewProjectPage";
import ManualProjectPage from "@/pages/ManualProjectPage/ManualProjectPage";


export default function App() {


  // =========================================================
  // AI LISTENER
  // =========================================================

  useEffect(() => {

    const cleanup =
      registerAIListener();

    return cleanup;

  }, []);


  // =========================================================
  // APP
  // =========================================================

  return (

    <>

      {/* =====================================================
          MAIN APP
      ===================================================== */}

      <MainLayout>

        <Routes>


          {/* ================================================
              HOME
          ================================================ */}

          <Route
            path="/"
            element={
              <HomePage />
            }
          />

<Route
  path="/new-project"
  element={
    <NewProjectPage />
  }
/>
          {/* ================================================
              PROJECT
          ================================================ */}
<Route
  path="/project/manual"
  element={
    <ManualProjectPage />
  }
/>
          <Route
            path="/project"
            element={
              <ProjectPage />
            }
          />


          {/* ================================================
              PROCESSING
          ================================================ */}

          <Route
            path="/processing"
            element={
              <ProcessingPage />
            }
          />


          {/* ================================================
              EDITOR - LINES
          ================================================ */}

          <Route
            path="/editor/lines"
            element={
              <EditLinePage />
            }
          />


          {/* ================================================
              EDITOR
          ================================================ */}

          <Route
            path="/editor"
            element={
              <EditorPage />
            }
          />


          {/* ================================================
              PROFILE
          ================================================ */}

          <Route
            path="/profile"
            element={
              <Profile />
            }
          />


        </Routes>

      </MainLayout>


      {/* =====================================================
          FORCE UPDATE MODAL

          Đặt ngoài MainLayout để phủ toàn bộ ứng dụng.
      ===================================================== */}

      <ModalUpdate />


    </>

  );

}