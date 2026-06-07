// src/components/AddressAutocomplete.js
// Google Places address autocomplete using the NEW programmatic API
// (AutocompleteSuggestion + AutocompleteSessionToken + Place), not the deprecated widget.
// Lazy-loads Maps JS on first focus. Gracefully degrades to a plain input
// if REACT_APP_GOOGLE_MAPS_KEY is missing or the script fails to load.

import React, { useCallback, useEffect, useRef, useState } from "react";

const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY;
const SCRIPT_ID = "novala-google-maps";

let mapsLoadPromise = null;

function loadGoogleMaps() {
  const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY;
  if (window.google && window.google.maps && typeof window.google.maps.importLibrary === "function") {
    return Promise.resolve();
  }
  if (window.__novalaMapsLoadPromise) return window.__novalaMapsLoadPromise;
  if (!GOOGLE_MAPS_KEY) return Promise.reject(new Error("Missing REACT_APP_GOOGLE_MAPS_KEY"));

  window.__novalaMapsLoadPromise = new Promise(function (resolve, reject) {
    try {
      // Google's official inline bootstrap loader. The classic script tag
      // (maps/api/js?libraries=places) does NOT expose importLibrary, which
      // the new AutocompleteSuggestion / Place API requires.
      (function (g) {
        var h, a, k, p = "The Google Maps JavaScript API",
            c = "google", l = "importLibrary", q = "__ib__",
            m = document, b = window;
        b = b[c] || (b[c] = {});
        var d = b.maps || (b.maps = {}),
            r = new Set(),
            e = new URLSearchParams(),
            u = function () {
              return h || (h = new Promise(function (f, n) {
                a = m.createElement("script");
                e.set("libraries", Array.from(r).join(","));
                for (k in g) e.set(k.replace(/[A-Z]/g, function (t) { return "_" + t[0].toLowerCase(); }), g[k]);
                e.set("callback", c + ".maps." + q);
                a.src = "https://maps." + c + "apis.com/maps/api/js?" + e;
                d[q] = f;
                a.onerror = function () { n(new Error(p + " could not load.")); };
                a.nonce = (m.querySelector("script[nonce]") || {}).nonce || "";
                a.id = "novala-google-maps";
                m.head.append(a);
              }));
            };
        if (d[l]) return;
        d[l] = function (f) {
          var n = Array.prototype.slice.call(arguments, 1);
          return r.add(f) && u().then(function () { return d[l].apply(d, [f].concat(n)); });
        };
      })({ key: GOOGLE_MAPS_KEY, v: "weekly" });

      if (window.google && window.google.maps && typeof window.google.maps.importLibrary === "function") {
        resolve();
      } else {
        reject(new Error("Bootstrap loader did not install importLibrary"));
      }
    } catch (err) {
      reject(err);
    }
  });

  return window.__novalaMapsLoadPromise;
}

function parseAddressComponents(components) {
  const out = { street: "", city: "", postalCode: "", provinceCode: "", country: "" };
  if (!components || !Array.isArray(components)) return out;
  let streetNumber = "";
  let route = "";
  let locality = "";
  let postalTown = "";
  for (const c of components) {
    const types = c.types || [];
    if (types.includes("street_number")) streetNumber = c.longText || "";
    else if (types.includes("route")) route = c.longText || "";
    else if (types.includes("locality")) locality = c.longText || "";
    else if (types.includes("postal_town")) postalTown = c.longText || "";
    else if (types.includes("postal_code")) out.postalCode = c.longText || "";
    else if (types.includes("administrative_area_level_1")) out.provinceCode = c.shortText || "";
    else if (types.includes("country")) out.country = c.shortText || "";
  }
  out.street = [streetNumber, route].filter(Boolean).join(" ");
  out.city = locality || postalTown || "";
  return out;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  country,
  placeholder,
  style,
  className,
}) {
  const [predictions, setPredictions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(!GOOGLE_MAPS_KEY);

  const tokenRef = useRef(null);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);
  const placesRef = useRef(null);

  const ensureLoaded = useCallback(async () => {
    if (loadError) return false;
    if (loaded && placesRef.current) return true;
    try {
      await loadGoogleMaps();
      const lib = await window.google.maps.importLibrary("places");
      placesRef.current = {
        AutocompleteSuggestion: lib.AutocompleteSuggestion,
        AutocompleteSessionToken: lib.AutocompleteSessionToken,
      };
      setLoaded(true);
      return true;
    } catch (err) {
      console.warn("[AddressAutocomplete] Maps load failed:", err && err.message);
      setLoadError(true);
      return false;
    }
  }, [loaded, loadError]);

  useEffect(() => {
    if (!showDropdown) return undefined;
    function handle(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showDropdown]);

  async function handleInput(e) {
    const next = e.target.value;
    if (typeof onChange === "function") onChange(next);

    if (loadError || !GOOGLE_MAPS_KEY) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }
    if (next.length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const ok = await ensureLoaded();
      if (!ok) return;
      try {
        const { AutocompleteSuggestion, AutocompleteSessionToken } = placesRef.current;
        if (!tokenRef.current) tokenRef.current = new AutocompleteSessionToken();
        const request = { input: next, sessionToken: tokenRef.current };
        const cc = (country || "").toString().trim();
        if (cc) request.includedRegionCodes = [cc.toLowerCase()];
        const result = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        const list = (result && result.suggestions) || [];
        setPredictions(list);
        setShowDropdown(list.length > 0);
        setHighlight(0);
      } catch (err) {
        console.warn("[AddressAutocomplete] fetch failed:", err && err.message);
        setPredictions([]);
        setShowDropdown(false);
      }
    }, 250);
  }

  async function selectPrediction(s) {
    try {
      const place = s.placePrediction.toPlace();
      await place.fetchFields({ fields: ["addressComponents", "formattedAddress"] });
      const parsed = parseAddressComponents(place.addressComponents);
      if (typeof onAddressSelect === "function") onAddressSelect(parsed);
      setPredictions([]);
      setShowDropdown(false);
      tokenRef.current = null;
    } catch (err) {
      console.warn("[AddressAutocomplete] place fetch failed:", err && err.message);
    }
  }

  function handleKeyDown(e) {
    if (!showDropdown || predictions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(predictions.length - 1, h + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(0, h - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); if (predictions[highlight]) selectPrediction(predictions[highlight]); }
    else if (e.key === "Escape") { setShowDropdown(false); }
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <input
        type="text"
        value={value}
        onChange={handleInput}
        onFocus={() => {
          ensureLoaded();
          if (predictions.length > 0) setShowDropdown(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        style={style}
        autoComplete="off"
      />
      {showDropdown && predictions.length > 0 ? (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          background: "#fff",
          border: "1px solid rgba(14,26,26,0.06)",
          borderRadius: 11,
          boxShadow: "0 1px 2px rgba(16,24,40,0.06), 0 16px 40px -12px rgba(11,55,57,0.25)",
          zIndex: 60,
          overflow: "hidden",
          maxHeight: 340,
          overflowY: "auto",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}>
          {predictions.map((s, idx) => {
            const text = (s.placePrediction && s.placePrediction.text && s.placePrediction.text.text) || "";
            const isHi = idx === highlight;
            return (
              <div
                key={idx}
                onMouseEnter={() => setHighlight(idx)}
                onMouseDown={(e) => { e.preventDefault(); selectPrediction(s); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  cursor: "pointer",
                  background: isHi ? "#F1F5F5" : "transparent",
                  fontSize: 14,
                  color: "#0E1A1A",
                  transition: "background 0.1s",
                }}
              >
                <span style={{ color: "#0F9599", flexShrink: 0, display: "inline-flex" }} aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </span>
                <span>{text}</span>
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "6px 12px", borderTop: "1px solid #EEF2F2", background: "#F9FAFA" }}>
            <img
              src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png"
              alt="powered by Google"
              height="14"
              style={{ display: "block" }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
