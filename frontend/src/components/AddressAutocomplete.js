// src/components/AddressAutocomplete.js
// Google Places address autocomplete using the NEW programmatic API
// (AutocompleteSuggestion + AutocompleteSessionToken + Place).
// Uses Google's inline bootstrap loader so window.google.maps.importLibrary is available.
// Falls back to a plain text input if the API key is missing or the script fails to load.

import React, { useState, useEffect, useRef, useCallback } from "react";

const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY;
const DEBOUNCE_MS = 250;
const MIN_QUERY_LEN = 3;

// Diagnostic: log once on module load so we can confirm the build picked up the env var.
if (typeof window !== "undefined") {
  console.log("[AddressAutocomplete] module loaded; key present:", !!GOOGLE_MAPS_KEY);
}

function loadGoogleMaps() {
  if (window.google && window.google.maps && typeof window.google.maps.importLibrary === "function") {
    return Promise.resolve();
  }
  if (window.__novalaMapsLoadPromise) return window.__novalaMapsLoadPromise;
  if (!GOOGLE_MAPS_KEY) return Promise.reject(new Error("Missing REACT_APP_GOOGLE_MAPS_KEY"));

  window.__novalaMapsLoadPromise = new Promise(function (resolve, reject) {
    try {
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

function parseAddressComponents(place) {
  const out = { street: "", city: "", postalCode: "", provinceCode: "", country: "" };
  if (!place || !place.addressComponents) return out;
  let streetNumber = "";
  let route = "";
  let postalTown = "";
  for (const comp of place.addressComponents) {
    const types = comp.types || [];
    if (types.includes("street_number")) streetNumber = comp.longText || comp.shortText || "";
    else if (types.includes("route")) route = comp.longText || comp.shortText || "";
    else if (types.includes("locality")) out.city = comp.longText || comp.shortText || "";
    else if (types.includes("postal_town")) postalTown = comp.longText || comp.shortText || "";
    else if (types.includes("postal_code")) out.postalCode = comp.longText || comp.shortText || "";
    else if (types.includes("administrative_area_level_1")) out.provinceCode = comp.shortText || "";
    else if (types.includes("country")) out.country = comp.shortText || "";
  }
  out.street = [streetNumber, route].filter(Boolean).join(" ").trim();
  if (!out.city) out.city = postalTown;
  return out;
}

const PIN_SVG = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F9599" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const GOOGLE_LOGO_URL = "https://developers.google.com/static/maps/documentation/images/google_on_white.png";

export default function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  country = "CA",
  placeholder,
  className,
  style,
}) {
  const [predictions, setPredictions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const sessionTokenRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const ensureLoaded = useCallback(async () => {
    if (loaded) return true;
    try {
      await loadGoogleMaps();
      if (!sessionTokenRef.current) {
        const { AutocompleteSessionToken } = await window.google.maps.importLibrary("places");
        sessionTokenRef.current = new AutocompleteSessionToken();
      }
      setLoaded(true);
      return true;
    } catch (err) {
      console.error("[AddressAutocomplete] Maps load failed:", err && err.message ? err.message : err);
      return false;
    }
  }, [loaded]);

  const handleFocus = useCallback(() => {
    console.log("[AddressAutocomplete] focus");
    ensureLoaded();
  }, [ensureLoaded]);

  const fetchPredictions = useCallback(async (query) => {
    if (!query || query.length < MIN_QUERY_LEN) {
      setPredictions([]);
      setOpen(false);
      return;
    }
    const ok = await ensureLoaded();
    if (!ok) return;
    try {
      const { AutocompleteSuggestion } = await window.google.maps.importLibrary("places");
      const request = { input: query, sessionToken: sessionTokenRef.current };
      if (country) request.includedRegionCodes = [String(country).toLowerCase()];
      const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
      const placePredictions = (suggestions || []).map((s) => s.placePrediction).filter(Boolean);
      setPredictions(placePredictions);
      setOpen(placePredictions.length > 0);
      setActiveIndex(-1);
    } catch (err) {
      console.error("[AddressAutocomplete] suggestions failed:", err && err.message ? err.message : err);
    }
  }, [country, ensureLoaded]);

  const handleChange = useCallback((e) => {
    const next = e.target.value;
    if (onChange) onChange(next);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => fetchPredictions(next), DEBOUNCE_MS);
  }, [onChange, fetchPredictions]);

  const handleSelect = useCallback(async (prediction) => {
    setOpen(false);
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ["addressComponents", "formattedAddress"] });
      const fields = parseAddressComponents(place);
      if (onAddressSelect) onAddressSelect(fields);
      const { AutocompleteSessionToken } = await window.google.maps.importLibrary("places");
      sessionTokenRef.current = new AutocompleteSessionToken();
    } catch (err) {
      console.error("[AddressAutocomplete] place fetch failed:", err && err.message ? err.message : err);
    }
  }, [onAddressSelect]);

  const handleKeyDown = useCallback((e) => {
    if (!open || predictions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % predictions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? predictions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < predictions.length) {
        e.preventDefault();
        handleSelect(predictions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }, [open, predictions, activeIndex, handleSelect]);

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <input
        type="text"
        value={value || ""}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        style={style}
        autoComplete="off"
        spellCheck={false}
      />
      {open && predictions.length > 0 && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "#fff",
            border: "1.6px solid #DDE5E5",
            borderRadius: 13,
            boxShadow: "0 8px 24px rgba(14,26,26,0.10)",
            zIndex: 1000,
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {predictions.map((pred, idx) => {
            const text = pred.text && pred.text.toString ? pred.text.toString() : "";
            const isActive = idx === activeIndex;
            return (
              <div
                key={pred.placeId || idx}
                role="option"
                aria-selected={isActive}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(pred); }}
                onMouseEnter={() => setActiveIndex(idx)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  cursor: "pointer",
                  background: isActive ? "#F9FAFA" : "#fff",
                  borderBottom: "1px solid #EEF2F2",
                  fontSize: 14,
                  color: "#0E1A1A",
                }}
              >
                {PIN_SVG}
                <span style={{ flex: 1 }}>{text}</span>
              </div>
            );
          })}
          <div style={{ padding: "8px 14px", display: "flex", justifyContent: "flex-end", background: "#fff" }}>
            <img src={GOOGLE_LOGO_URL} alt="powered by Google" height="14" style={{ height: 14, width: "auto" }} />
          </div>
        </div>
      )}
    </div>
  );
}
