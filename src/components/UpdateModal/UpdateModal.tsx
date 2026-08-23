import { useEffect, useState } from "react";

import "./UpdateModal.css";

type UpdateState =
  | "checking"
  | "available"
  | "downloading"
  | "downloaded"
  | "error";

interface UpdateInfo {
  version?: string;
  percent?: number;
  message?: string;
}

export default function UpdateModal() {

  const [state, setState] =
    useState<UpdateState>("checking");

  const [version, setVersion] =
    useState("");

  const [percent, setPercent] =
    useState(0);

  const [error, setError] =
    useState("");


  useEffect(() => {

    const removeChecking =
      window.electronAPI.on(
        "update:checking",
        () => {

          setState("checking");

        }
      );


    const removeAvailable =
      window.electronAPI.on(
        "update:available",
        (data) => {

          const info =
            data as UpdateInfo;

          setVersion(
            info.version ?? ""
          );

          setState("available");

        }
      );


    const removeProgress =
      window.electronAPI.on(
        "update:progress",
        (data) => {

          const info =
            data as UpdateInfo;

          setPercent(
            info.percent ?? 0
          );

          setState("downloading");

        }
      );


    const removeDownloaded =
      window.electronAPI.on(
        "update:downloaded",
        (data) => {

          const info =
            data as UpdateInfo;

          setVersion(
            info.version ?? version
          );

          setPercent(100);

          setState("downloaded");

        }
      );


    const removeError =
      window.electronAPI.on(
        "update:error",
        (data) => {

          const info =
            data as UpdateInfo;

          setError(
            info.message ??
            "Không thể cập nhật."
          );

          setState("error");

        }
      );


    return () => {

      removeChecking();
      removeAvailable();
      removeProgress();
      removeDownloaded();
      removeError();

    };

  }, []);


  // Đang kiểm tra thì không cần hiện modal
  if (state === "checking") {
    return null;
  }


  // Có lỗi -> cũng có thể không hiện
  if (state === "error") {
    return null;
  }


  return (

    <div className="update-overlay">

      <div className="update-modal">

        {state === "available" && (

          <>

            <div className="update-icon">
              🚀
            </div>

            <h2>
              Có bản cập nhật mới
            </h2>

            <p>
              SubKaraokeAI đã có phiên bản
              <strong> {version}</strong>.
            </p>

            <p className="update-description">
              Cập nhật để sử dụng những tính năng
              và sửa lỗi mới nhất.
            </p>

            <div className="update-actions">

              <button
                className="update-button"
                onClick={async () => {

                  setState("downloading");

                  setPercent(0);

                  await window.electronAPI.invoke(
                    "update:download"
                  );

                }}
              >
                Cập nhật
              </button>

            </div>

          </>

        )}


        {state === "downloading" && (

          <>

            <div className="update-icon">
              ⬇️
            </div>

            <h2>
              Đang cập nhật
            </h2>

            <p>
              Đang tải phiên bản {version}
            </p>

            <div className="progress-container">

              <div className="progress-bar">

                <div
                  className="progress-value"
                  style={{
                    width: `${percent}%`,
                  }}
                />

              </div>

              <span>
                {percent.toFixed(0)}%
              </span>

            </div>

            <p className="update-description">
              Vui lòng không tắt ứng dụng.
            </p>

          </>

        )}


        {state === "downloaded" && (

          <>

            <div className="update-icon">
              ✅
            </div>

            <h2>
              Cập nhật đã sẵn sàng
            </h2>

            <p>
              Phiên bản {version} đã được tải xuống.
            </p>

            <div className="update-actions">

              <button
                className="update-button"
                onClick={async () => {

                  await window.electronAPI.invoke(
                    "update:install"
                  );

                }}
              >
                Khởi động lại & cập nhật
              </button>

            </div>

          </>

        )}

      </div>

    </div>

  );

}