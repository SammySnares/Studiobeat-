(() => {
  "use strict";

  const app = document.getElementById("app");
  if (!app) return;

  /* =========================================================
     STUDIOBEAT — BANDLAB-STYLE MOBILE STUDIO
     BLACK + WHITE ONLY
     ========================================================= */

  /* ---------- STYLE ---------- */

  if (!document.getElementById("studiobeat-new-style")) {
    const style = document.createElement("style");
    style.id = "studiobeat-new-style";

    style.textContent = `
      *{
        box-sizing:border-box;
      }

      html,body{
        margin:0;
        padding:0;
        width:100%;
        min-height:100%;
        background:#000;
        color:#fff;
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      }

      body{
        overflow:hidden;
      }

      button,input{
        font:inherit;
      }

      button{
        color:#fff;
        background:#111;
        border:1px solid #333;
        border-radius:12px;
        cursor:pointer;
        touch-action:manipulation;
      }

      button:active{
        transform:scale(.97);
        background:#222;
      }

      #app{
        width:100%;
        height:100vh;
        height:100dvh;
      }

      .sb-app{
        width:100%;
        height:100%;
        background:#000;
        color:#fff;
        display:flex;
        flex-direction:column;
        overflow:hidden;
      }

      .sb-header{
        min-height:70px;
        padding:14px 16px;
        padding-top:max(14px,env(safe-area-inset-top));
        border-bottom:1px solid #222;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
      }

      .sb-brand{
        font-size:20px;
        font-weight:900;
        letter-spacing:1px;
      }

      .sb-subtitle{
        color:#999;
        font-size:12px;
      }

      .sb-back{
        width:44px;
        height:44px;
        border-radius:50%;
        font-size:22px;
        flex:none;
      }

      .sb-screen{
        flex:1;
        overflow:auto;
        padding:16px;
        padding-bottom:110px;
      }

      .sb-title{
        font-size:28px;
        font-weight:900;
        margin:4px 0 5px;
      }

      .sb-muted{
        color:#888;
        font-size:13px;
      }

      .project-card{
        margin-top:20px;
        padding:18px;
        border:1px solid #333;
        border-radius:18px;
        background:#0c0c0c;
      }

      .project-card h2{
        margin:0 0 6px;
        font-size:21px;
      }

      .project-card p{
        margin:0;
        color:#888;
        font-size:13px;
      }

      .timeline{
        margin-top:18px;
        border:1px solid #292929;
        border-radius:16px;
        overflow:hidden;
        background:#080808;
      }

      .timeline-ruler{
        display:flex;
        min-width:900px;
        border-bottom:1px solid #292929;
      }

      .timeline-ruler div{
        width:64px;
        padding:8px 4px;
        text-align:center;
        color:#777;
        font-size:11px;
        border-right:1px solid #181818;
      }

      .track{
        min-width:900px;
        min-height:74px;
        display:flex;
        border-bottom:1px solid #222;
      }

      .track-info{
        width:120px;
        min-width:120px;
        padding:10px;
        border-right:1px solid #292929;
      }

      .track-info b{
        display:block;
        font-size:13px;
      }

      .track-info small{
        color:#777;
        font-size:10px;
      }

      .track-lane{
        position:relative;
        flex:1;
        background:
          repeating-linear-gradient(
            90deg,
            #080808 0,
            #080808 63px,
            #181818 64px
          );
      }

      .clip{
        position:absolute;
        top:13px;
        height:48px;
        min-width:100px;
        border:1px solid #fff;
        border-radius:9px;
        background:#1b1b1b;
        padding:8px;
        font-size:11px;
        overflow:hidden;
      }

      .transport{
        margin-top:16px;
        display:flex;
        justify-content:center;
        align-items:center;
        gap:10px;
      }

      .transport button{
        width:48px;
        height:48px;
        border-radius:50%;
      }

      .bpm-box
