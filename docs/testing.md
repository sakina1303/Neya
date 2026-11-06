# Phase 1 verification

## Automated

Run `npm run build` for TypeScript and production bundling. Run `npm test` for the landmark-to-region mapping unit test.

Observed on 6 November 2026: the production build completed and the region mapping unit test passed. In the local in-app browser, a real webcam stream opened, the Face Landmarker reported 478 landmarks for one detected face, and the processing indicator showed approximately 29–30 fps. The Regions control became selected; End camera returned the UI to its idle state. The agent could not direct the person in front of the camera to move, so movement-following, reacquisition, and alternate device/browser checks remain open acceptance steps.

## Physical webcam acceptance test

Use a laptop or phone with a real camera on localhost or HTTPS:

1. Open the dashboard and check desktop and mobile layouts.
2. Open Face Studio and select **Enable camera**. Verify that the browser asks for camera permission only after the click.
3. Allow access. Check that live video appears and the status moves through model loading to face tracking.
4. Turn left and right, tilt, move closer and farther, and speak naturally. Confirm that mesh lines track the visible face and do not stay fixed to the screen.
5. Select **Regions**. Check that labels follow the face. Select **No overlay** and confirm that video continues without graphics.
6. Move out of frame. Confirm that status changes to searching and the overlay disappears. Return and confirm reacquisition.
7. End camera. Confirm that the browser camera indicator turns off.
8. Deny permission, disconnect the camera, and start while another app owns it. Confirm useful recovery messages and a working **Try again** action.

Record the device, browser, operating system, lighting, and observed frame rate for acceptance. This environment may run builds and browser UI checks, but a physical camera test must be reported only if one was actually available.
