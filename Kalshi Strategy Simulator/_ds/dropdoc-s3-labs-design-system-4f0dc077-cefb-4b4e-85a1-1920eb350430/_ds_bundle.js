/* @ds-bundle: {"format":3,"namespace":"DropDocS3LabsDesignSystem_4f0dc0","components":[],"sourceHashes":{"ui_kits/dropdoc/App.jsx":"429cdf23fe51","ui_kits/dropdoc/Components.jsx":"9a7071358739","ui_kits/dropdoc/Dropzone.jsx":"29b911135154","ui_kits/dropdoc/Sections.jsx":"2b08938d920b"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DropDocS3LabsDesignSystem_4f0dc0 = window.DropDocS3LabsDesignSystem_4f0dc0 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// ui_kits/dropdoc/App.jsx
try { (() => {
/* DropDoc landing page — dark marketing site with working dropzone. */
const {
  useState: _apUS
} = React;
function DropDocApp() {
  const [results, setResults] = _apUS([]);
  const [uploading, setUploading] = _apUS(false);
  const [copiedSlug, setCopiedSlug] = _apUS(null);
  const uploadFiles = async files => {
    setUploading(true);
    setResults([]);
    await new Promise(r => setTimeout(r, 900));
    const newOnes = Array.from(files).map(f => {
      const ok = /\.html?$/i.test(f.name);
      if (!ok) return {
        filename: f.name,
        error: "Only .html and .htm files are accepted"
      };
      const slug = Math.random().toString(36).slice(2, 8);
      const title = f.name.replace(/\.html?$/i, "").replace(/[-_]+/g, " ");
      return {
        filename: f.name,
        slug,
        title,
        url: `/r/${slug}`
      };
    });
    setResults(newOnes);
    setUploading(false);
  };
  const copyLink = slug => {
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("header", {
    className: "dd-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dd-header-inner"
  }, /*#__PURE__*/React.createElement(BrandLockup, {
    height: 22
  }), /*#__PURE__*/React.createElement("nav", {
    className: "dd-nav"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#features"
  }, "Features"), /*#__PURE__*/React.createElement("a", {
    href: "#how-it-works"
  }, "How it works"), /*#__PURE__*/React.createElement("a", {
    href: "#faq"
  }, "FAQ")), /*#__PURE__*/React.createElement("div", {
    className: "dd-header-right"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dd-status-dot"
  }, "Site in progress"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", {
    className: "dd-version"
  }, "v0.0.1")))), /*#__PURE__*/React.createElement("main", {
    className: "dd-main"
  }, /*#__PURE__*/React.createElement("section", {
    className: "dd-hero dd-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dd-hero-text"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dd-pill-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dd-pill"
  }, "Coming soon"), /*#__PURE__*/React.createElement("span", {
    className: "dd-pill-meta"
  }, "full website under construction", /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }, "\xB7"), "est. 2026")), /*#__PURE__*/React.createElement("h1", {
    className: "dd-h1"
  }, "Smart.", /*#__PURE__*/React.createElement("br", null), "Simple.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    className: "accent"
  }, "Software.")), /*#__PURE__*/React.createElement("p", {
    className: "dd-lead"
  }, "S3 Labs is a software studio shipping single-purpose apps that are free or one-time purchase. Try out our first tool, ", /*#__PURE__*/React.createElement("span", {
    className: "em",
    style: {
      color: "var(--brand)"
    }
  }, "DropDoc"), ", which turns any HTML report into a stable shareable link in seconds."), /*#__PURE__*/React.createElement("div", {
    className: "dd-cta-row"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#dropzone",
    className: "btn btn-primary"
  }, "Try DropDoc ", /*#__PURE__*/React.createElement(IcArrow, {
    size: 14
  })), /*#__PURE__*/React.createElement("a", {
    href: "#",
    className: "btn btn-secondary"
  }, "Have a good idea?"))), /*#__PURE__*/React.createElement("div", {
    id: "dropzone",
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Dropzone, {
    onFiles: uploadFiles,
    uploading: uploading
  })), results.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "dd-results"
  }, results.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: `toast${r.error ? " err" : ""}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "toast-left"
  }, !r.error && /*#__PURE__*/React.createElement("span", {
    className: "toast-dot"
  }, /*#__PURE__*/React.createElement(IcCheck, null)), /*#__PURE__*/React.createElement("div", {
    className: "toast-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "toast-title"
  }, r.title || r.filename), /*#__PURE__*/React.createElement("div", {
    className: "toast-meta"
  }, r.error ? r.error : `dropdoc.app${r.url}`))), r.slug && /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    style: {
      height: 32,
      fontSize: 12,
      padding: "0 14px"
    },
    onClick: () => copyLink(r.slug)
  }, copiedSlug === r.slug ? "Copied" : "Copy link")))), /*#__PURE__*/React.createElement(StatsRow, null)), /*#__PURE__*/React.createElement(FeaturesSection, null), /*#__PURE__*/React.createElement(StepsSection, null), /*#__PURE__*/React.createElement(FAQSection, null)), /*#__PURE__*/React.createElement(FooterSection, null));
}
window.DropDocApp = DropDocApp;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dropdoc/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dropdoc/Components.jsx
try { (() => {
/* DropDoc UI kit — shared JSX components. */

const {
  useState,
  useEffect,
  useRef,
  useCallback
} = React;

/* ───────── Brand ───────── */

function BrandMark({
  size = 24,
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size * 120 / 100,
    viewBox: "0 0 100 120",
    className: className,
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("clipPath", {
    id: `dc-${size}`
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 50 6 C 72 34 88 60 88 78 A 38 38 0 1 1 12 78 C 12 60 28 34 50 6 Z"
  }))), /*#__PURE__*/React.createElement("path", {
    d: "M 50 6 C 72 34 88 60 88 78 A 38 38 0 1 1 12 78 C 12 60 28 34 50 6 Z",
    fill: "#2E9DF1"
  }), /*#__PURE__*/React.createElement("g", {
    clipPath: `url(#dc-${size})`
  }, /*#__PURE__*/React.createElement("g", {
    stroke: "#ffffff",
    strokeWidth: "0.8",
    strokeOpacity: "0.55"
  }, [34, 44, 54, 64, 74, 84, 94, 104].map(y => /*#__PURE__*/React.createElement("line", {
    key: y,
    x1: "0",
    y1: y,
    x2: "100",
    y2: y
  }))), /*#__PURE__*/React.createElement("line", {
    x1: "30",
    y1: "0",
    x2: "30",
    y2: "120",
    stroke: "#ffffff",
    strokeWidth: "0.9",
    strokeOpacity: "0.9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 58 14 C 56 26 62 36 72 44 C 78 48 84 50 88 50 L 88 30 C 80 24 68 18 58 14 Z",
    fill: "#c5dff6"
  })));
}
function BrandLockup({
  height = 28
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(BrandMark, {
    size: height
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 900,
      letterSpacing: "-0.03em",
      fontSize: height * 0.92,
      lineHeight: 1,
      color: "var(--text-primary)",
      textTransform: "uppercase"
    }
  }, "Drop", /*#__PURE__*/React.createElement("sup", {
    style: {
      fontSize: "0.55em",
      color: "var(--brand)",
      marginLeft: 1
    }
  }, "DOC")));
}

/* ───────── Icons ───────── */

const IcCheck = ({
  size = 12
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 12 12",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M2.5 6.5 L5 9 L9.5 3.5"
}));
const IcLink = ({
  size = 14
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.6",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M6.5 9.5 L9.5 6.5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M9 4.5 L10.5 3 A2.5 2.5 0 0 1 14 6.5 L12.5 8 M7 11.5 L5.5 13 A2.5 2.5 0 0 1 2 9.5 L3.5 8"
}));
const IcArrow = ({
  size = 14
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 8 H13"
}), /*#__PURE__*/React.createElement("path", {
  d: "M9 4 L13 8 L9 12"
}));
const IcPlus = ({
  size = 14
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.6",
  strokeLinecap: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M8 3 V13"
}), /*#__PURE__*/React.createElement("path", {
  d: "M3 8 H13"
}));
const IcSpinner = () => /*#__PURE__*/React.createElement("svg", {
  width: "22",
  height: "22",
  viewBox: "0 0 24 24",
  fill: "none",
  className: "spin"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "9",
  stroke: "currentColor",
  strokeOpacity: "0.25",
  strokeWidth: "2.5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M21 12 A9 9 0 0 0 12 3",
  stroke: "currentColor",
  strokeWidth: "2.5",
  strokeLinecap: "round"
}));
const IcEye = ({
  size = 16
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.5",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M1.5 8 C 3 4.5 5.2 3 8 3 C 10.8 3 13 4.5 14.5 8 C 13 11.5 10.8 13 8 13 C 5.2 13 3 11.5 1.5 8 Z"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "8",
  cy: "8",
  r: "2"
}));
const IcShield = ({
  size = 16
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.5",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M8 1.5 L13.5 4 V8.5 C 13.5 11 11 13.2 8 14.5 C 5 13.2 2.5 11 2.5 8.5 V4 Z"
}), /*#__PURE__*/React.createElement("path", {
  d: "M5.5 8 L7 9.5 L10.5 6"
}));
const IcBolt = ({
  size = 16
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.5",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M9 1.5 L3 9 H7.5 L7 14.5 L13 7 H8.5 Z"
}));
const IcMagic = ({
  size = 16
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.5",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 13 L11 5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M9 3 L13 7"
}), /*#__PURE__*/React.createElement("path", {
  d: "M5 1.5 V3.5 M4 2.5 H6"
}), /*#__PURE__*/React.createElement("path", {
  d: "M13 10 V12 M12 11 H14"
}));
const IcCode = ({
  size = 16
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.5",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M5.5 5 L2 8 L5.5 11"
}), /*#__PURE__*/React.createElement("path", {
  d: "M10.5 5 L14 8 L10.5 11"
}), /*#__PURE__*/React.createElement("path", {
  d: "M9 3 L7 13"
}));
const IcEdit = ({
  size = 16
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.5",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M2.5 13.5 H4.5 L13 5 L11 3 L2.5 11.5 Z"
}), /*#__PURE__*/React.createElement("path", {
  d: "M9.5 4.5 L11.5 6.5"
}));
Object.assign(window, {
  BrandMark,
  BrandLockup,
  IcCheck,
  IcLink,
  IcArrow,
  IcPlus,
  IcSpinner,
  IcEye,
  IcShield,
  IcBolt,
  IcMagic,
  IcCode,
  IcEdit
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dropdoc/Components.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dropdoc/Dropzone.jsx
try { (() => {
/* Dropzone — focal drag/drop area. */
const {
  useState: _dzUS,
  useRef: _dzUR
} = React;
function Dropzone({
  onFiles,
  uploading
}) {
  const [dragging, setDragging] = _dzUS(false);
  const inputRef = _dzUR(null);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: `dz${dragging ? " dragging" : ""}`,
    onClick: () => inputRef.current?.click(),
    onDragOver: e => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: e => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length > 0) onFiles(e.dataTransfer.files);
    }
  }, /*#__PURE__*/React.createElement("input", {
    ref: inputRef,
    type: "file",
    accept: ".html,.htm",
    multiple: true,
    style: {
      display: "none"
    },
    onChange: e => {
      if (e.target.files?.length) onFiles(e.target.files);
      e.target.value = "";
    }
  }), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    className: "dz-hatch"
  }), /*#__PURE__*/React.createElement("div", {
    className: "dz-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: `dz-chip${uploading ? " uploading" : dragging ? " dragging" : " idle"}`
  }, uploading ? /*#__PURE__*/React.createElement(IcSpinner, null) : /*#__PURE__*/React.createElement(BrandMark, {
    size: 30
  })), /*#__PURE__*/React.createElement("p", {
    className: "dz-lead"
  }, uploading ? "Uploading…" : dragging ? "Release to upload" : "Drop HTML reports here"), /*#__PURE__*/React.createElement("p", {
    className: "dz-hint"
  }, "or click to browse", /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }, "\xB7"), ".html files up to 1.25 MB"))), /*#__PURE__*/React.createElement("p", {
    className: "dz-tail"
  }, "Uploads you make here stay in this tab\u2019s report list until you close it. Shareable links keep working after that \u2014 the list just resets."));
}
window.Dropzone = Dropzone;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dropdoc/Dropzone.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dropdoc/Sections.jsx
try { (() => {
/* Marketing sections: stats, features, steps, FAQ, footer. */
const {
  useState: _scUS
} = React;
function StatsRow() {
  const stats = [{
    num: "< 5s",
    unit: "",
    label: "drop to live link"
  }, {
    num: "0",
    unit: "",
    label: "accounts to create"
  }, {
    num: "∞",
    unit: "",
    label: "shares per link"
  }, {
    num: "1.25",
    unit: "MB",
    label: "per HTML file"
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "dd-stats"
  }, stats.map((s, i) => /*#__PURE__*/React.createElement("div", {
    className: "dd-stat",
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    className: "dd-stat-num"
  }, s.num, s.unit && /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, s.unit)), /*#__PURE__*/React.createElement("div", {
    className: "dd-stat-label"
  }, s.label))));
}
function FeaturesSection() {
  const items = [{
    Icon: IcEye,
    h: "Live as the source",
    p: "Drop the file. We host it as-is — no PDF rasterizing, no re-rendering, no lossy export. What you see locally is what your client sees.",
    tag: "WYSIWYG",
    tagDim: false
  }, {
    Icon: IcLink,
    h: "Clean every link",
    p: "Each upload gets a six-character URL. No accidental directory listings, no leakable filenames, just one tidy link to send.",
    tag: "/r/xk29ab",
    tagDim: false
  }, {
    Icon: IcShield,
    h: "Links don't expire",
    p: "No 7-day countdown, no archived after 30 days. Once a link is out in the wild, it keeps resolving — until you delete it.",
    tag: "TTL: forever",
    tagDim: false
  }, {
    Icon: IcBolt,
    h: "Fast first paint",
    p: "Reports are served from edge cache the moment they're uploaded. No build step, no warm-up — even the first viewer waits zero seconds.",
    tag: "edge cached",
    tagDim: true
  }, {
    Icon: IcCode,
    h: "Unopinionated tags",
    p: "Inline scripts, custom fonts, embedded charts, weird color profiles — all preserved verbatim. We don't normalize your HTML.",
    tag: "<as-is/>",
    tagDim: true
  }, {
    Icon: IcEdit,
    h: "Re-uploads in place",
    p: "Replace a report and its link stays the same. Your client refreshes; the new version's there. No emails about new URLs.",
    tag: "stable URL",
    tagDim: false
  }];
  return /*#__PURE__*/React.createElement("section", {
    className: "dd-section dd-container",
    id: "features"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dd-eyebrow"
  }, "\u2014 Features \u2014"), /*#__PURE__*/React.createElement("h2", {
    className: "dd-section-h2"
  }, "Built for the handoff, not the homepage."), /*#__PURE__*/React.createElement("p", {
    className: "dd-section-sub"
  }, "Every feature exists to make the moment when you send the link feel effortless on both ends."), /*#__PURE__*/React.createElement("div", {
    className: "dd-features"
  }, items.map(({
    Icon,
    h,
    p,
    tag,
    tagDim
  }, i) => /*#__PURE__*/React.createElement("article", {
    className: "feat",
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    className: "feat-icon"
  }, /*#__PURE__*/React.createElement(Icon, {
    size: 18
  })), /*#__PURE__*/React.createElement("h3", {
    className: "feat-h"
  }, h), /*#__PURE__*/React.createElement("p", {
    className: "feat-p"
  }, p), /*#__PURE__*/React.createElement("span", {
    className: `feat-tag${tagDim ? " muted" : ""}`
  }, tag)))));
}
function StepsSection() {
  const steps = [{
    n: "01",
    h: "Drop",
    p: /*#__PURE__*/React.createElement(React.Fragment, null, "Drag any ", /*#__PURE__*/React.createElement("code", null, ".html"), " file off your desktop into the dropzone. We accept anything up to 1.25 MB.")
  }, {
    n: "02",
    h: "Send link",
    p: /*#__PURE__*/React.createElement(React.Fragment, null, "You get back a clean, six-character link like ", /*#__PURE__*/React.createElement("code", null, "/r/xk29ab"), ". Send it however you send things.")
  }, {
    n: "03",
    h: "Share",
    p: /*#__PURE__*/React.createElement(React.Fragment, null, "Your client opens it in any browser. No login, no account. Just the report, exactly as you built it.")
  }];
  return /*#__PURE__*/React.createElement("section", {
    className: "dd-section alt",
    id: "how-it-works"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dd-container"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dd-eyebrow"
  }, "\u2014 How it works \u2014"), /*#__PURE__*/React.createElement("h2", {
    className: "dd-section-h2"
  }, "Three steps. One minute."), /*#__PURE__*/React.createElement("div", {
    className: "dd-steps"
  }, steps.map((s, i) => /*#__PURE__*/React.createElement("div", {
    className: "step",
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    className: "step-num"
  }, s.n), /*#__PURE__*/React.createElement("h3", {
    className: "step-h"
  }, s.h), /*#__PURE__*/React.createElement("p", {
    className: "step-p"
  }, s.p))))));
}
const FAQS = [{
  q: "Is it really free?",
  a: "Yes. The current version is free while DropDoc is in beta. No credit card, no limits per account beyond the 1.25 MB per file size cap."
}, {
  q: "Do links expire?",
  a: "Never automatically. Links resolve until you delete the report from your dashboard or replace its content with a re-upload."
}, {
  q: "Can I password-protect a report?",
  a: "Not yet — it's the most-asked feature. We're shipping per-link passcodes and link expiry controls in the next release."
}, {
  q: "What happens to scripts in my HTML?",
  a: "Inline scripts run as you wrote them. We don't sanitize, transpile, or minify. Use the same caution you would on any static host."
}, {
  q: "Can I use a custom domain?",
  a: "Custom domains land in v0.2. For now every report lives under dropdoc.app/r/<slug>."
}, {
  q: "Who's making this?",
  a: "S3 Labs — a tiny studio shipping single-purpose tools. DropDoc is our first."
}];
function FAQSection() {
  const [open, setOpen] = _scUS(0);
  return /*#__PURE__*/React.createElement("section", {
    className: "dd-section dd-container",
    id: "faq"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dd-eyebrow"
  }, "\u2014 Questions \u2014"), /*#__PURE__*/React.createElement("h2", {
    className: "dd-section-h2"
  }, "Things worth asking."), /*#__PURE__*/React.createElement("div", {
    className: "dd-faq"
  }, FAQS.map((f, i) => {
    const isOpen = open === i;
    return /*#__PURE__*/React.createElement("div", {
      className: `faq-item${isOpen ? " open" : ""}`,
      key: i
    }, /*#__PURE__*/React.createElement("button", {
      className: "faq-q",
      onClick: () => setOpen(isOpen ? -1 : i)
    }, /*#__PURE__*/React.createElement("span", null, f.q), /*#__PURE__*/React.createElement("span", {
      className: "chev"
    }, /*#__PURE__*/React.createElement(IcPlus, {
      size: 14
    }))), /*#__PURE__*/React.createElement("div", {
      className: "faq-a"
    }, /*#__PURE__*/React.createElement("div", {
      className: "faq-a-inner"
    }, /*#__PURE__*/React.createElement("p", {
      className: "faq-a-text"
    }, f.a))));
  })));
}
function FooterSection() {
  return /*#__PURE__*/React.createElement("footer", {
    className: "dd-footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dd-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dd-footer-inner"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(BrandLockup, {
    height: 22
  }), /*#__PURE__*/React.createElement("p", {
    className: "dd-footer-tag"
  }, "A tiny utility from S3 Labs. Drop, copy, send.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: "dd-foot-h"
  }, "Product"), /*#__PURE__*/React.createElement("ul", {
    className: "dd-foot-list"
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#features"
  }, "Features")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#how-it-works"
  }, "How it works")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#faq"
  }, "FAQ")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: "dd-foot-h"
  }, "Studio"), /*#__PURE__*/React.createElement("ul", {
    className: "dd-foot-list"
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "S3 Labs")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "All products")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Changelog")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: "dd-foot-h"
  }, "Legal"), /*#__PURE__*/React.createElement("ul", {
    className: "dd-foot-list"
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Terms")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Privacy")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Acceptable use"))))), /*#__PURE__*/React.createElement("div", {
    className: "dd-footer-bottom"
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 S3 Labs"), /*#__PURE__*/React.createElement("span", null, "v0.0.1 \xB7 build 2026.05.04"))));
}
Object.assign(window, {
  StatsRow,
  FeaturesSection,
  StepsSection,
  FAQSection,
  FooterSection
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dropdoc/Sections.jsx", error: String((e && e.message) || e) }); }

})();
