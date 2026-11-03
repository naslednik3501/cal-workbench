# Restored calculator illustrations — 2026-11-03

Restores 135 original images through 320 explicit CAL SHA/control/reference
bindings covering 288 unique calculators. Across the current catalog aliases,
these bindings resolve 623 previously missing picture references. The restored
files total 19,944,573 bytes and retain their original SHA-256; there is no
conversion, redrawing, cropping, or replacement of technical content.

The prior visual review supplies image categories. Selection requires an exact
calculator/source folder and one matching image content there, a unique matching
part number, or a reviewed named brand logo with matching calculator context.
`image-resource-provenance.json` records source archive/member, original hashes,
470 source-context bindings, and the matching evidence. Equivalent CAL contents
at other catalog paths share the same exact control binding. Generic basename
lookup is never used at runtime. Hardware wiring and unidentified pictures are
not included in this restoration.

The current reference inventory still contains 1,714 unresolved occurrences,
including 154 empty picture controls. Missing and ambiguous original images are
not replaced by guessed photographs. This number is an image-reference count,
not a count of broken calculation algorithms.

## Integration

- Load `image-resource-data.js`, then `image-resources.js`, before `app.js`.
- Preserve the existing embedded-resource lookup. If it finds no image, call
  `CAL_IMAGES.resolve(selected.sha, control)`. Respect
  `scope.resourceExcluded(selected.sha, control.id, restored.sha)` before use.
- For a restored image, set `src`, `width`, and `height` from the returned
  descriptor; keep the `calPicture` class and set
  `dataset.imageCategory = restored.category`. Use the reference text as alt.
- Add both JavaScript files and the paths in `image-assets.json` to the static
  build assets and release manifest. The provenance JSON is for source review;
  the browser does not need it.
- Sportage 95160's `Kia.bmp` already resolves to the existing shared original in
  `Calculators/Pictures/Kia.bmp`; no replacement is necessary.

The stylesheet displays technical images at their natural size within the form,
shrinking to available width or 440px height without cropping. Restored logos
stay within 140 × 88px. Form groups also fit narrow viewports.

## Checks

`node tools/test-image-resources.js` verifies every asset hash, package path,
original CAL/control/reference binding, exclusion policy, and refusal to resolve
unknown CALs or changed references. It also checks that identical generic names
in different CALs cannot cross-resolve.

Chromium decoded all 135 original assets and verified their natural dimensions.
A form-layout harness at 1280px, 375px and 320px verified no horizontal overflow,
constrained logo dimensions, and readable uncropped board illustrations. The
app integration and complete static-build checks are performed by the lead
after combining the parallel changes.
