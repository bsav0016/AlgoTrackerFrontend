import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { Routes } from "@/app/Routes";
import { useRouteTo } from "@/contexts/RouteContext";
import { useStrategy } from "@/contexts/StrategyContext";
import { useToast } from "@/contexts/ToastContext";
import { useUser } from "@/contexts/UserContext";
import { strategyIdFromData } from "./NotificationEntry";

/** Returns a function that opens one of the signed-in user's strategies by id, or says it is gone. */
export function useOpenStrategy() {
    const { user } = useUser();
    const { setStrategy } = useStrategy();
    const { routeTo } = useRouteTo();
    const { addToast } = useToast();

    return (strategyId: number | null): boolean => {
        const strategy = strategyId === null ? undefined : user?.strategies.find((s) => s.id === strategyId);
        if (!strategy) {
            addToast("That strategy is no longer available");
            return false;
        }
        setStrategy(strategy);
        routeTo(Routes.ViewStrategy);
        return true;
    };
}

// A tap is handled once per app run, not once per time the home screen mounts.
let lastHandledResponseId: string | null = null;

/** Opens the strategy named in a notification the user tapped, including the one that launched the app. Call it
 *  from the screen the user lands on after signing in; it waits for the user's data to load. */
export function useOpenStrategyOnNotificationTap() {
    const response = Notifications.useLastNotificationResponse();
    const { user } = useUser();
    const openStrategy = useOpenStrategy();

    useEffect(() => {
        if (!response || !user) return;
        const responseId = response.notification.request.identifier;
        if (lastHandledResponseId === responseId) return;
        lastHandledResponseId = responseId;
        const strategyId = strategyIdFromData(response.notification.request.content.data);
        if (strategyId !== null) {
            openStrategy(strategyId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only a new tap or the user loading should act
    }, [response, user]);
}
