import { useEffect } from "react";
import { Routes } from "@/app/Routes";
import { useRouteTo } from "@/contexts/RouteContext";
import { useUser } from "@/contexts/UserContext";
import { isShareId } from "./ShareLink";

// A link can open the app before anyone is signed in. The id waits here, in memory, until the home screen (which
// only shows once the user is signed in) takes it.
let pendingShareId: string | null = null;

export function setPendingShare(shareId: string | null | undefined): boolean {
    if (!isShareId(shareId)) return false;
    pendingShareId = shareId;
    return true;
}

/** Returns the waiting id once, then forgets it. */
export function takePendingShare(): string | null {
    const shareId = pendingShareId;
    pendingShareId = null;
    return shareId;
}

/** Call from the screen the user lands on after signing in: opens the shared-strategy screen for a link that
 *  opened the app. Waits for the user's data to load, like the notification-tap handler. */
export function useOpenPendingShare() {
    const { user } = useUser();
    const { routeTo } = useRouteTo();

    useEffect(() => {
        if (!user) return;
        const shareId = takePendingShare();
        if (shareId) {
            routeTo(Routes.SharedStrategy, { shareId });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only the user loading should act
    }, [user]);
}
