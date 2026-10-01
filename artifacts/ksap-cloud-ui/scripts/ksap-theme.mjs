/**
 * KSAP extension to the DTCG generator. Values come exclusively from tokens.json;
 * this is the authored source for the lock, named utilities and component overlay.
 */
function mix(a, b, ratio) {
  const rgb = (hex) => hex.slice(1).match(/../g).map((n) => parseInt(n, 16));
  return "#" + rgb(a).map((v, i) => Math.round(v * ratio + rgb(b)[i] * (1 - ratio)).toString(16).padStart(2, "0")).join("");
}
function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map((n) => parseInt(n,16)/255).map((v) => v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
}
function contrast(a,b) {
  const values=[luminance(a),luminance(b)].sort((a,b)=>b-a);
  return (values[0]+.05)/(values[1]+.05);
}
// Missing non-blue stops follow the documented blue lightness curve in OKLCH.
// Explicit source anchors always win; gamut mapping reduces chroma, not lightness.
const blueScale={50:"#EFF6FF",100:"#DBEAFE",200:"#BFDBFE",300:"#93C5FD",350:"#6DAEEC",400:"#4C9AE8",500:"#1258B5",600:"#06459A",700:"#053B83",800:"#082F67",900:"#10284A",950:"#0A172B"};
function oklch(hex) {
  const [r,g,b]=hex.slice(1).match(/../g).map(n=>parseInt(n,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
  const L=.2104542553*l+.793617785*m-.0040720468*s,a=1.9779984951*l-2.428592205*m+.4505937099*s,B=.0259040371*l+.7827717662*m-.808675766*s;
  return [L,Math.hypot(a,B),Math.atan2(B,a)*180/Math.PI];
}
function gamutHex(L,C,h) {
  const linear=(chroma)=>{
    const a=chroma*Math.cos(h*Math.PI/180),b=chroma*Math.sin(h*Math.PI/180);
    const l=(L+.3963377774*a+.2158037573*b)**3,m=(L-.1055613458*a-.0638541728*b)**3,s=(L-.0894841775*a-1.291485548*b)**3;
    return [4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s];
  };
  let lo=0,hi=C;
  for(let i=0;i<24;i++){const mid=(lo+hi)/2;linear(mid).every(v=>v>=0&&v<=1)?lo=mid:hi=mid;}
  return "#"+linear(lo).map(v=>Math.round(255*(v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055)).toString(16).padStart(2,"0")).join("");
}
function shade(anchor,baseStep,step,hue) {
  const a=oklch(anchor),base=oklch(blueScale[baseStep]),target=oklch(blueScale[step]);
  return gamutHex(Math.min(.99,Math.max(.05,target[0]+a[0]-base[0])),a[1]*target[1]/base[1],hue);
}
const kebab = (key) => key.replace(/([a-z])([A-Z])/g,"$1-$2").replace(/([a-z])([1-5])/g,"$1-$2").toLowerCase();
export function buildKSAPTheme(tokens) {
  const source=tokens.$extensions["com.ksap.cloud"];
  const roles=Object.keys(tokens.color.light);
  const mappings=roles.map((role)=>`--color-${kebab(role)}:hsl(var(--${kebab(role)}));`).join("\n");
  const density=Object.entries(source.densities).map(([name,d])=>`:root${name==="standard"?"":`[data-density="${name}"]`}{--ksap-body:${d.body}px;--ksap-line:${d.line}px;--ksap-row-h:${d.row}px;--ksap-control-h:${d.control}px;--ksap-pad:${d.pad}px;--ksap-icon:${d.icon}px;}`).join("\n");
  const defaults=(mode)=>Object.entries(tokens.color[mode]).map(([key])=>`--${kebab(key)}:__DS_${mode.toUpperCase()}_${key.toUpperCase()}__;`).join("\n");
  const darkDefaults=()=>defaults("dark")+"--foreground:0 0% 100% / .9;--card-foreground:0 0% 100% / .9;--popover-foreground:0 0% 100% / .9;--muted-foreground:0 0% 100% / .64;--border:0 0% 100% / .1;--input:0 0% 100% / .34;--ksap-text-disabled:rgb(255 255 255 / .4);";
  const palette=(name,mode)=>{
    const p=source.palettes[name][mode],dark=mode==="dark";
    const canvas=dark?"#0A172B":"#FFFFFF";
    const hue={blue:258,red:12,green:162,yellow:90}[name];
    const hover=p.hover??shade(p.fill,dark?400:500,dark?350:600,hue);
    const pressed=p.pressed??shade(p.fill,dark?400:500,dark?300:700,hue);
    const selected=p.selected??(dark?mix(p.fill,canvas,.14):shade(p.fill,500,50,hue));
    const selectedFg=p.selectedFg??p.ink;
    for(const fill of [p.fill,hover,pressed]){
      if(contrast(fill,p.onFill)<4.5)throw new Error(`${name}/${mode}: button text fails AA on ${fill}`);
    }
    for(const surface of [canvas,tokens.color[mode].card.$value,tokens.color[mode].secondary.$value]){
      if(contrast(p.ink,surface)<4.5)throw new Error(`${name}/${mode}: action ink fails AA`);
    }
    const railText=name==="yellow"&&!dark?"#010D43":"#FFFFFF";
    const strong = name==="blue"?(dark?"#152A49":blueScale[100]):shade(p.fill,dark?400:500,dark?800:100,hue);
    const mutedChart = name==="blue"?blueScale[dark?900:200]:shade(p.fill,dark?400:500,dark?900:200,hue);
    return `--ksap-action:${p.fill};--ksap-action-ink:${p.ink};--ksap-action-hover:${hover};--ksap-action-pressed:${pressed};--ksap-on-action:${p.onFill};--ksap-selected:${selected};--ksap-selected-fg:${selectedFg};--ksap-strong:${strong};--ksap-chart-muted:${mutedChart};--ksap-rail:${p.rail};--ksap-rail-text:${railText};`;
  };
  const status=(mode)=>`--ksap-text-disabled:${mode==="dark"?"rgb(255 255 255 / .4)":"rgb(1 13 67 / .42)"};--ksap-skeleton:${mode==="dark"?"rgb(255 255 255 / .07)":"#E8EEF6"};--ksap-info-subtle:${mode==="dark"?mix(source.status.dark.info,"#0A172B",.14):"#EFF6FF"};`+
    (mode==="dark"?["success","warning","danger"].map(k=>`--ksap-${k}-subtle:${mix(source.status.dark[k],"#0A172B",.14)};`).join(""):"")+
    Object.entries(source.status[mode]).map(([k,v])=>`--ksap-${kebab(k)}:${v};`).join("")+
    Object.entries(source.groups).map(([name,values])=>Object.entries(values[mode]).map(([role,v])=>`--ksap-group-${name}-${role}:${v};`).join("")).join("");
  let modes=`:root{${status("light")}${palette("blue","light")}}\n:root.dark,:root[data-theme="dark"]{${darkDefaults()}${status("dark")}${palette("blue","dark")}}\n`;
  for(const name of Object.keys(source.palettes)){
    modes+=`:root[data-palette="${name}"]{${palette(name,"light")}}\n:root.dark[data-palette="${name}"],:root[data-theme="dark"][data-palette="${name}"]{${palette(name,"dark")}}\n`;
  }
  modes+=`@media(prefers-color-scheme:dark){:root:not([data-theme="light"]):not([data-theme="dark"]){${darkDefaults()}${status("dark")}${palette("blue","dark")}}}`;
  for(const name of Object.keys(source.palettes))modes+=`@media(prefers-color-scheme:dark){:root:not([data-theme="light"]):not([data-theme="dark"])[data-palette="${name}"]{${palette(name,"dark")}}}`;
  return `
/* KSAP Cloud UI 6.1. Generated from the DTCG source and authored extension. */
@font-face{font-family:"Montserrat";font-style:normal;font-weight:400;font-display:swap;src:url("../docs/references/fonts/montserrat-400.ttf") format("truetype")}
@font-face{font-family:"Montserrat";font-style:normal;font-weight:600;font-display:swap;src:url("../docs/references/fonts/montserrat-600.ttf") format("truetype")}
@font-face{font-family:"IBM Plex Mono";font-style:normal;font-weight:400;font-display:swap;src:url("../docs/references/fonts/ibm-plex-mono-400.ttf") format("truetype")}
@theme{--color-*:initial;--radius-*:initial;--shadow-*:initial;--font-*:initial;--text-*:initial;--font-weight-*:initial;--animate-*:initial;}
@theme inline{
${mappings}
--color-primary:var(--ksap-action);--color-primary-foreground:var(--ksap-on-action);
--color-primary-ink:var(--ksap-action-ink);--color-primary-hover:var(--ksap-action-hover);
--color-ring:var(--ksap-action-ink);--color-accent:var(--ksap-selected);--color-accent-foreground:var(--ksap-selected-fg);
--color-surface:hsl(var(--muted));--color-success:var(--ksap-success);--color-warning:var(--ksap-warning);--color-danger:var(--ksap-danger);--color-info:var(--ksap-info);
--color-surface-strong:var(--ksap-strong);--color-disabled:var(--ksap-text-disabled);
--color-success-subtle:var(--ksap-success-subtle);--color-warning-subtle:var(--ksap-warning-subtle);--color-danger-subtle:var(--ksap-danger-subtle);--color-info-subtle:var(--ksap-info-subtle);
--color-info-foreground:var(--ksap-info);--color-success-foreground:var(--ksap-success);--color-warning-foreground:var(--ksap-warning);--color-danger-foreground:var(--ksap-danger);
--color-rail:var(--ksap-rail);--color-rail-foreground:var(--ksap-rail-text);
--color-chart-1:var(--ksap-action-ink);--color-chart-2:var(--ksap-chart-muted);
--color-sidebar:var(--ksap-rail);--color-sidebar-foreground:var(--ksap-rail-text);
--color-sidebar-accent:color-mix(in srgb,var(--ksap-rail-text) 14%,transparent);--color-sidebar-accent-foreground:var(--ksap-rail-text);
--color-sidebar-primary:var(--ksap-rail-text);--color-sidebar-primary-foreground:var(--ksap-rail);
--color-sidebar-border:color-mix(in srgb,var(--ksap-rail-text) 20%,transparent);--color-sidebar-ring:var(--ksap-rail-text);
--font-sans:var(--app-font-sans);--font-mono:var(--app-font-mono);
--font-weight-normal:400;--font-weight-semibold:600;
--text-display:36px;--text-display--line-height:44px;--text-title:28px;--text-title--line-height:36px;
--text-heading:20px;--text-heading--line-height:28px;--text-subheading:16px;--text-subheading--line-height:24px;
--text-body:var(--ksap-body);--text-body--line-height:var(--ksap-line);--text-caption:12px;--text-caption--line-height:16px;
--radius-sm:3px;--radius-md:6px;--radius-lg:12px;--radius-full:9999px;
}
${density}
${modes}
@utility h-control{height:var(--ksap-control-h)}
@utility size-control{height:var(--ksap-control-h);width:var(--ksap-control-h)}
@utility h-target{height:44px}
@utility h-hairline{height:1px}
@utility w-hairline{width:1px}
@utility min-h-textarea{min-height:96px}
@utility size-icon-xs{width:12px;height:12px}
@utility size-icon-sm{width:16px;height:16px}
@utility size-icon-md{width:var(--ksap-icon);height:var(--ksap-icon)}
@utility size-icon-lg{width:24px;height:24px}
@utility size-icon-xl{width:32px;height:32px;stroke-width:1.5}
@utility max-w-page{max-width:1280px}
@utility max-w-sheet{max-width:min(420px,100vw - 2rem)}
/* Effective pointer targets without changing the dense visual control. */
@utility hit-44{position:relative;&::after{content:"";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);min-width:44px;min-height:44px;width:100%;height:100%;}}
@utility border-w-control{border-width:1.5px}
@utility shadow-hairline{box-shadow:inset 0 0 0 1px hsl(var(--border))}
@utility max-h-table{max-height:max(420px,100dvh - 18rem)}
@utility grid-cols-hero{grid-template-columns:2fr 1fr 1fr}
@utility grid-cols-split{grid-template-columns:3fr 2fr}
@utility grid-cols-board{grid-template-columns:1fr 3fr}
@utility pt-safe{padding-top:env(safe-area-inset-top)}
@utility pb-safe{padding-bottom:env(safe-area-inset-bottom)}
@utility top-safe{top:env(safe-area-inset-top)}
@utility top-safe-3{top:calc(env(safe-area-inset-top) + 12px)}
@utility top-shell{top:calc(env(safe-area-inset-top) + var(--ksap-environment-h,0px))}
@utility h-shell{height:calc(100dvh - env(safe-area-inset-top) - var(--ksap-environment-h,0px))}
@custom-variant can-hover (@media (hover:hover) and (pointer:fine));
@utility shadow-overlay{box-shadow:0 8px 24px rgb(1 13 67 / .16)}
@utility shadow-critical{box-shadow:0 12px 32px rgb(1 13 67 / .24)}
body{font-size:var(--ksap-body);line-height:var(--ksap-line);font-variant-numeric:tabular-nums;font-weight:400}
h1,h2,h3,h4,strong,b{font-weight:600}
:focus-visible{outline:2px solid var(--ksap-action-ink);outline-offset:2px}
[data-slot="button"]{position:relative;border-radius:6px;cursor:pointer;transition:background-color 100ms cubic-bezier(.2,0,.38,.9),border-color 100ms cubic-bezier(.2,0,.38,.9),transform 100ms cubic-bezier(.2,0,.38,.9)}
[data-slot="button"]::after{content:"";position:absolute;inset-inline:0;inset-block:calc((var(--ksap-control-h) - 44px)/2);min-height:44px}
[data-slot="button"][data-size="icon"]::after{inset-inline:calc((var(--ksap-control-h) - 44px)/2)}
[data-slot="button"] svg{width:var(--ksap-icon);height:var(--ksap-icon)}
[data-slot="button"][data-size="sm"] svg{width:16px;height:16px}
[data-slot="button"][data-variant="default"]{box-shadow:inset 0 -2px rgb(1 13 67 / .16)}
[data-slot="button"][data-variant="default"]:hover{background:var(--ksap-action-hover)}
[data-slot="button"][data-variant="default"]:active{background:var(--ksap-action-pressed);box-shadow:inset 0 2px rgb(1 13 67 / .16)}
[data-slot="button"][data-variant="link"]{color:var(--ksap-action-ink)}
[data-slot="button"]:active:not(:disabled){transform:translateY(1px)}
[data-slot="button"]:disabled:not([data-loading]){opacity:.42;cursor:not-allowed}
[data-slot="button"][data-loading]{color:transparent;cursor:wait}
[data-slot="button"][data-loading] svg{visibility:hidden}
[data-slot="button"][data-loading]::before{content:"";position:absolute;width:20px;height:20px;border:2px solid var(--ksap-on-action);border-inline-end-color:transparent;border-radius:50%;animation:ksap-spin 1.6s linear infinite}
[data-slot="button"][data-loading]:not([data-variant="default"]):not([data-variant="destructive"])::before{border-color:var(--ksap-action-ink);border-inline-end-color:transparent}
[data-palette="red"] [data-slot="button"][data-variant="destructive"]{background:transparent;color:var(--ksap-danger);border:1.5px solid var(--ksap-danger)}
[data-slot="input"],[data-slot="textarea"]{border-width:1.5px;transition:border-color 100ms cubic-bezier(.2,0,.38,.9)}
[data-slot="input"][aria-invalid="true"],[data-slot="textarea"][aria-invalid="true"]{border-color:var(--ksap-danger)}
[data-slot="input"]:disabled,[data-slot="textarea"]:disabled{opacity:.42}
[data-slot="input"]:read-only,[data-slot="textarea"]:read-only{background:hsl(var(--muted))}
[data-slot="checkbox"],[data-slot="radio-group-item"],[data-slot="switch"],[data-slot="select-trigger"]{border-width:1.5px}
[data-slot="toggle-group-item"][data-state="on"],[data-slot="select-item"][data-state="checked"]{box-shadow:inset 3px 0 var(--ksap-action-ink)}
[data-slot="tabs-trigger"][data-state="active"]{color:var(--ksap-action-ink);box-shadow:inset 0 -2px var(--ksap-action-ink)}
[role="menuitemcheckbox"][aria-checked="true"],[role="menuitemradio"][aria-checked="true"]{background:var(--ksap-selected);box-shadow:inset 3px 0 var(--ksap-action-ink);color:var(--ksap-selected-fg)}
[data-slot="progress-indicator"],[data-slot="slider-range"]{background:var(--ksap-action-ink)}
[data-slot="progress"][data-indeterminate] [data-slot="progress-indicator"]{width:25%;animation:ksap-progress 1.6s linear infinite}
[data-slot="skeleton"]{background:var(--ksap-skeleton);animation:ksap-pulse 1.6s linear infinite}
[data-sonner-toast]{font-family:var(--app-font-sans)!important;font-size:var(--ksap-body)!important;background:hsl(var(--popover))!important;color:hsl(var(--popover-foreground))!important;border:1px solid hsl(var(--border))!important;border-radius:12px!important;box-shadow:0 8px 24px rgb(1 13 67 / .16)!important}
[data-slot="dialog-content"],[data-slot="sheet-content"],[data-slot="alert-dialog-content"]{border-radius:12px;box-shadow:0 8px 24px rgb(1 13 67 / .16)}
[data-slot="alert-dialog-content"]{box-shadow:0 12px 32px rgb(1 13 67 / .24)}
[data-slot$="-overlay"]{background:rgb(1 13 67 / .4)}
[data-slot$="-overlay"][data-state="open"]{animation:ksap-enter-scrim 240ms cubic-bezier(.2,0,.38,.9)}
[data-slot$="-overlay"][data-state="closed"]{animation:ksap-exit-scrim 180ms cubic-bezier(.2,0,.38,.9)}
[data-slot="sheet-content"][data-side="right"]{border-start-end-radius:0;border-end-end-radius:0}
[data-slot="sheet-content"][data-side="left"]{border-start-start-radius:0;border-end-start-radius:0}
[data-state="open"][data-slot$="-content"]{animation:ksap-enter 240ms cubic-bezier(.2,0,.38,.9)}
[data-state="closed"][data-slot$="-content"]{animation:ksap-exit 180ms cubic-bezier(.2,0,.38,.9)}
[data-slot="table-row"]{height:var(--ksap-row-h)}
[data-slot="table-head"],[data-slot="table-cell"]{padding-inline:var(--ksap-pad);padding-block:0;vertical-align:middle}
[data-slot="table-row"][data-state="selected"]{background:var(--ksap-selected);box-shadow:inset 3px 0 var(--ksap-action-ink)}
[data-slot="table-row"][data-state="selected"]>[data-slot="table-cell"]:first-child{box-shadow:inset 3px 0 var(--ksap-action-ink)}
[data-slot="table-head"][data-group],[data-slot="table-cell"][data-group]{background:var(--ksap-group-fill);color:var(--ksap-group-ink)}
[data-slot="table-head"][data-group]{background:var(--ksap-group-header)}
[data-slot="table-head"][scope="colgroup"][data-group]{border-top:3px solid var(--ksap-group-edge)}
[data-group="a"]{--ksap-group-fill:var(--ksap-group-a-fill);--ksap-group-header:var(--ksap-group-a-header);--ksap-group-edge:var(--ksap-group-a-edge);--ksap-group-ink:var(--ksap-group-a-ink)}
[data-group="b"]{--ksap-group-fill:var(--ksap-group-b-fill);--ksap-group-header:var(--ksap-group-b-header);--ksap-group-edge:var(--ksap-group-b-edge);--ksap-group-ink:var(--ksap-group-b-ink)}
[data-group="c"]{--ksap-group-fill:var(--ksap-group-c-fill);--ksap-group-header:var(--ksap-group-c-header);--ksap-group-edge:var(--ksap-group-c-edge);--ksap-group-ink:var(--ksap-group-c-ink)}
[data-slot="table-head"][data-group]+[data-slot="table-head"][data-group],[data-slot="table-cell"][data-group]+[data-slot="table-cell"][data-group]{border-inline-start:2px solid hsl(var(--background))}
[data-slot="table-cell"][data-group] [data-slot="badge"]{border-color:currentColor}
[data-slot="field-error"]{display:flex;gap:8px;align-items:start}
[data-slot="field-error"] svg{width:16px;height:16px;flex-shrink:0}
[data-slot="field-description"]{max-width:80ch}
.ksap-success-message{display:flex;gap:8px;color:var(--ksap-success);font-size:12px;line-height:16px}
.ksap-success-message svg{width:16px;height:16px}
@keyframes ksap-spin{to{transform:rotate(360deg)}}
@keyframes ksap-pulse{50%{opacity:.45}}
@keyframes ksap-progress{from{transform:translateX(-100%)}to{transform:translateX(400%)}}
@keyframes ksap-enter{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
@keyframes ksap-exit{from{opacity:1}to{opacity:0;transform:translateY(4px)}}
@keyframes ksap-enter-scrim{from{opacity:0}to{opacity:1}}
@keyframes ksap-exit-scrim{from{opacity:1}to{opacity:0}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
@media(forced-colors:active){[data-slot="button"],[data-slot="input"],[data-slot="textarea"]{border:1px solid ButtonText}}
/* Documentation layout uses named utilities, not product-specific compositions. */
.ksap-browser{min-height:100dvh;display:grid;grid-template-columns:264px minmax(0,1fr)}
.ksap-nav{background:var(--ksap-rail);color:var(--ksap-rail-text);padding:24px 16px;position:sticky;top:0;height:100dvh;overflow-y:auto}
.ksap-nav-title{font-size:20px;line-height:28px;font-weight:600;margin-bottom:4px}
.ksap-nav-note{font-size:12px;line-height:16px;opacity:.8;margin-bottom:24px}
.ksap-nav-group{font-size:12px;font-weight:600;margin:24px 12px 8px}
.ksap-nav a{color:inherit;display:block;padding:8px 12px;margin-block:4px;border-inline-start:3px solid transparent;border-radius:6px;font-size:14px;line-height:22px;min-height:44px}
.ksap-nav a[aria-current="page"]{background:color-mix(in srgb,var(--ksap-rail-text) 14%,transparent);border-inline-start-color:var(--ksap-rail-text);font-weight:600}
.ksap-nav input{color:var(--ksap-rail-text);background:transparent;border-color:var(--ksap-rail-text)}
.ksap-nav input::placeholder{color:inherit;opacity:.8}
.ksap-toolbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid hsl(var(--border));padding:16px 32px;background:hsl(var(--background))}
.ksap-controls{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.ksap-control-label{display:flex;flex-direction:column;gap:4px;font-size:12px;line-height:16px;color:hsl(var(--muted-foreground))}
.ksap-select{font:inherit;font-size:14px;color:hsl(var(--foreground));background:hsl(var(--background));border:1.5px solid hsl(var(--input));border-radius:6px;height:36px;padding-inline:8px}
.ksap-main{padding:32px;max-width:1280px}
.ksap-prose{max-width:80ch}
.ksap-panel{border:1px solid hsl(var(--border));border-radius:12px;padding:var(--ksap-pad);background:hsl(var(--card))}
.ksap-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.ksap-pilot-grid{display:grid;grid-template-columns:3fr 2fr;gap:24px;align-items:start}
.ksap-story{display:flex;flex-direction:column;gap:24px}
.ksap-story-row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.ksap-section-title{font-size:16px;line-height:24px;font-weight:600;margin-bottom:12px}
.ksap-caption{font-size:12px;line-height:16px;color:hsl(var(--muted-foreground))}
.ksap-swatches{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.ksap-swatch{height:64px;border-radius:6px;border:1px solid hsl(var(--border));margin-bottom:8px}
${roles.map(role=>`.ksap-swatch-${role}{background:var(--color-${kebab(role)})}`).join("\n")}
.ksap-guidelines{border-inline-start:3px solid var(--ksap-action-ink);padding-inline-start:16px;max-width:80ch}
.ksap-guidelines ul{padding-inline-start:20px;list-style:disc}
.ksap-guidelines li{margin-block:8px}
.ksap-mobile-nav{display:none}
.ksap-foundation-row{min-height:var(--ksap-row-h);padding-inline:var(--ksap-pad);display:flex;align-items:center;background:hsl(var(--muted));border-bottom:1px solid hsl(var(--border))}
.ksap-group-a{background:var(--ksap-group-a-fill);color:var(--ksap-group-a-ink)}
.ksap-group-b{background:var(--ksap-group-b-fill);color:var(--ksap-group-b-ink)}
.ksap-group-c{background:var(--ksap-group-c-fill);color:var(--ksap-group-c-ink)}
.ksap-skip{position:fixed;inset-inline-start:12px;top:-100px;padding:12px;background:hsl(var(--background));z-index:99}
.ksap-skip:focus{top:12px}
@media(max-width:1023px){.ksap-browser{grid-template-columns:1fr}.ksap-nav{display:none}.ksap-mobile-nav{display:block}.ksap-main,.ksap-toolbar{padding:20px}.ksap-pilot-grid,.ksap-grid{grid-template-columns:1fr}}
`;
}