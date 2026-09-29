# Design QA

- Source visual truth: user-provided Forest Download desktop reference image in the active conversation.
- Source dimensions: 1536 × 1005 pixels.
- Implementation: Forest Download Next.js/Tauri home screen at `/`.
- Implementation screenshots: `implementation-selector-1536.png` and `implementation-selector.png`.
- Viewports: 1536 × 1005 and 1120 × 780 CSS pixels at device scale factor 1.
- Implementation pixel dimensions: 1536 × 1005 and 1120 × 780.
- Density normalization: source and primary implementation capture are both 1536 × 1005 at 1× density; no resampling was needed.
- State: valid YouTube link, media preview visible, Video selected, Best available selected.

## Full-view comparison evidence

The 1536 × 1005 source and implementation were reviewed together in the active conversation. The implementation retains the defining composition from the source: forest photography behind a dark glass desktop frame, persistent left navigation, a large editorial heading and URL field, a separate right-hand queue, and recent-download content below. The implementation intentionally extends the center column vertically to hold the requested type, quality, and summary steps; the app stage scrolls while the sidebar remains stable.

The 1120 × 780 capture confirms the same hierarchy at the Tauri default window size. The sidebar collapses to icons below 1040 pixels and becomes a top rail below 820 pixels, so the core controls are not hidden by horizontal overflow.

## Focused region comparison evidence

`implementation-selector.png` provides a closer view of the linked-media card, three format cards, selected-card treatment, and the start of the quality step. Text, icons, borders, selected states, and thumbnail cropping are readable at this scale, so a separate crop was not needed.

## Required fidelity surfaces

- Fonts and typography: Georgia provides the soft editorial display face from the reference; Inter/system UI text preserves compact desktop readability. The hierarchy, line height, truncation, and optical weight remain clear at both tested widths.
- Spacing and layout rhythm: the reference's sidebar/main/queue proportions, broad panel gaps, rounded glass surfaces, and calm density are preserved. The longer requested selector continues below the fold rather than compressing controls.
- Colors and visual tokens: deep pine base surfaces, moss actions, cream text, and restrained gold selection accents consistently map to the custom daisyUI theme.
- Image quality and asset fidelity: the generated 1536 × 1024 forest background is sharp at both test sizes, uses an appropriate crop, and stays subdued beneath the overlays. The media thumbnail is a real raster asset; Lucide supplies all interface icons.
- Copy and content: the requested headline, download modes, video qualities, audio formats, audio bitrates, queue labels, summary fields, and save-location action are present.

## Interaction and console checks

- Browser-rendered implementation returned HTTP 200 in Microsoft Edge.
- Valid-link browser preview populated the thumbnail, title, channel, duration, available heights, and selector.
- Video was selected by default; the Audio card was activated through Edge DevTools Protocol and revealed 4 audio-format cards plus 5 quality choices.
- The browser reported no runtime exceptions or console errors during the interaction check.
- Next.js production build, TypeScript validation, Rust `cargo check`, and Rust formatting passed.

## Findings

No actionable P0, P1, or P2 differences remain. The denser selector is an intentional extension of the source because the reference does not depict all requested quality and summary states.

## Comparison history

- Iteration 1: the empty-link state established the frame, sidebar, headline, queue, and recent-download regions at 1120 × 780.
- Iteration 2: the linked-video state was captured at 1120 × 780 and 1536 × 1005. The wider capture confirmed the source proportions and single-line heading; the smaller capture confirmed responsive wrapping and scrolling without clipped controls. No P0/P1/P2 fix was required after comparison.

## Implementation checklist

- [x] Match the forest desktop composition and visual hierarchy.
- [x] Verify default and wide desktop window sizes.
- [x] Verify linked-video and selected-format states.
- [x] Exercise the Video-to-Audio selector transition.
- [x] Check runtime console output.

## Follow-up polish

- P3: Recent cards reuse alternate crops of the shared forest background to keep the bundled app small; dedicated imagery could add more variety later.

final result: passed
