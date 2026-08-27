import {
  useEffect,
  useState
} from "react";

import "./UpdateModal.css";


type UpdateState =
  | "hidden"
  | "available"
  | "downloading"
  | "downloaded"
  | "error";


interface UpdateInfo {

  version?: string;

  percent?: number;

  message?: string;

}


export default function ModalUpdate() {

  const [state, setState] =
    useState<UpdateState>("hidden");


  const [version, setVersion] =
    useState("");


  const [percent, setPercent] =
    useState(0);


  const [message, setMessage] =
    useState("");


  useEffect(() => {

    // =====================================================
    // NO UPDATE
    // =====================================================

    const unsubscribeNotAvailable =
      window.electronAPI.on(
        "update:not-available",
        () => {

          setState("hidden");

        }
      );


    // =====================================================
    // UPDATE AVAILABLE
    // =====================================================

    const unsubscribeAvailable =
      window.electronAPI.on(
        "update:available",
        (data: unknown) => {

          const info =
            data as UpdateInfo;


          setState("available");


          setVersion(
            info.version ?? ""
          );


          setMessage(
            "Một phiên bản mới đã có sẵn."
          );

        }
      );


    // =====================================================
    // DOWNLOAD START
    // =====================================================

    const unsubscribeDownloading =
      window.electronAPI.on(
        "update:downloading",
        (data: unknown) => {

          const info =
            data as UpdateInfo;


          setState("downloading");


          setPercent(
            Math.round(
              info.percent ?? 0
            )
          );


          setMessage(
            info.message ??
            "Đang tải bản cập nhật..."
          );

        }
      );


    // =====================================================
    // DOWNLOAD PROGRESS
    // =====================================================

    const unsubscribeProgress =
      window.electronAPI.on(
        "update:progress",
        (data: unknown) => {

          const info =
            data as UpdateInfo;


          setState("downloading");


          setPercent(
            Math.round(
              info.percent ?? 0
            )
          );


          setMessage(
            info.message ??
            "Đang tải bản cập nhật..."
          );

        }
      );


    // =====================================================
    // DOWNLOADED
    // =====================================================

    const unsubscribeDownloaded =
      window.electronAPI.on(
        "update:downloaded",
        (data: unknown) => {

          const info =
            data as UpdateInfo;


          setState("downloaded");


          setPercent(100);


          if (
            info.version
          ) {

            setVersion(
              info.version
            );

          }

setMessage(
  "Bản cập nhật đã sẵn sàng. Vui lòng đóng và mở lại ứng dụng."
);

        }
      );


    // =====================================================
    // ERROR
    // =====================================================

    const unsubscribeError =
      window.electronAPI.on(
        "update:error",
        (data: unknown) => {

          const info =
            data as UpdateInfo;


          setState("error");


          setMessage(
            info.message ??
            "Không thể cập nhật."
          );

        }
      );


    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {

      unsubscribeNotAvailable();

      unsubscribeAvailable();

      unsubscribeDownloading();

      unsubscribeProgress();

      unsubscribeDownloaded();

      unsubscribeError();

    };

  }, []);


  // =========================================================
  // KHÔNG CÓ UPDATE
  // =========================================================

  if (
    state === "hidden"
  ) {

    return null;

  }


  // =========================================================
  // UPDATE AVAILABLE
  // =========================================================

  if (
    state === "available"
  ) {

    return (

      <div className="update-overlay">

        <div className="update-modal">

          <div className="update-logo">
            ↑
          </div>


          <h2>
            Có bản cập nhật mới
          </h2>


          {version && (

            <div className="update-version">

              Version {version}

            </div>

          )}


          <p>
            {message}
          </p>


          <button
            className="update-button"
            onClick={() => {

              setState(
                "downloading"
              );


              setPercent(0);


              setMessage(
                "Đang bắt đầu tải bản cập nhật..."
              );


              window.electronAPI.send(
                "update:download"
              );

            }}
          >
            Cập nhật
          </button>

        </div>

      </div>

    );

  }


  // =========================================================
  // ERROR
  // =========================================================

  if (
    state === "error"
  ) {

    return (

      <div className="update-overlay">

        <div className="update-modal">

          <div className="update-icon">
            !
          </div>


          <h2>
            Cập nhật thất bại
          </h2>


          <p>
            {message}
          </p>


          <button
            className="update-button"
            onClick={() => {

              setState(
                "hidden"
              );


              setMessage("");


              window.electronAPI.send(
                "update:retry"
              );

            }}
          >
            Thử lại
          </button>

        </div>

      </div>

    );

  }


  // =========================================================
  // DOWNLOADING
  // =========================================================

  if (
    state === "downloading"
  ) {

    return (

      <div className="update-overlay">

        <div className="update-modal">

          <div className="update-logo">
            ↓
          </div>


          <h2>
            Đang cập nhật
          </h2>


          {version && (

            <div className="update-version">

              Version {version}

            </div>

          )}


          <p>
            {message}
          </p>


          <div className="update-progress">

            <div className="update-progress-track">

              <div
                className="update-progress-fill"
                style={{
                  width:
                    `${percent}%`
                }}
              />

            </div>


            <div className="update-progress-text">

              <span>
                Đang tải cập nhật
              </span>


              <strong>
                {percent}%
              </strong>

            </div>

          </div>

        </div>

      </div>

    );

  }


  // =========================================================
  // DOWNLOADED
  // =========================================================
if (
  state === "downloaded"
) {

  return (

    <div className="update-overlay">

      <div className="update-modal">

        <div className="update-success">

          <div className="update-check">
            ✓
          </div>

        </div>


        <h2>
          Cập nhật hoàn tất
        </h2>


        {version && (

          <div className="update-version">

            Version {version}

          </div>

        )}


        <p>
          Bản cập nhật đã sẵn sàng.
          Vui lòng đóng và mở lại ứng dụng để hoàn tất.
        </p>


        <button
          className="update-button"
          onClick={() => {

            window.electronAPI.send(
              "update:install"
            );

          }}
        >
          Đóng và mở lại
        </button>

      </div>

    </div>

  );

}


  return null;

}