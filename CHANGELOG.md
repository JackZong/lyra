# Changelog

All notable changes to this project will be documented in this file.

## [v1.1.0] - 2026-04-03

### Added
- Implemented comprehensive multi-language internationalization (i18n), offering auto-detection and manual toggling between English and Chinese.
- Integrated the macOS native application menu bar with dynamic multi-lingual item rendering.
- Added a Theme Customization feature, enabling personalized settings for sidebar width, editor font size, font family, etc., with persistent storage logic.
- Introduced custom Context Menu for image operations ("Open Image in New Window", "Copy Image", "Copy Image Link") seamlessly replacing the native OS WebView menus.

### Changed
- Improved the bottom layout design of the sidebar, unifying the toolbar experience for both Outline and File tree view modes.
- Redesigned the sidebar toggle behavior to remain accessible as a floating button at the bottom-left of the screen even when the sidebar is completely collapsed.
- Optimized the Preferences/Settings panel interface and aesthetics to fully support dark mode and dynamic theme switches.
- Enhanced application interactions with macOS features, resolving window controls (traffic lights) alignment layout issues.

### Fixed
- Intercepted and disabled the unexpected generic OS-level image right-click dialogs.
- Fixed the issue where editor-empty placeholder texts were not updated dynamically alongside the language settings.
- Resolved multiple TS compilation faults, missing Vue SFC imports, and unused variable lint errors.
