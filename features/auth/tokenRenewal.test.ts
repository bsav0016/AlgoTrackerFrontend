import { createTokenRenewer } from "./tokenRenewal";

type Renewal = { access: string; refresh: string | null };

function setup(stored: string | null = "refresh-1") {
    let current = stored;
    const saveRefresh = jest.fn(async (token: string) => { current = token; });
    const renew = jest.fn(async (_refresh: string): Promise<Renewal> => ({ access: "access-2", refresh: null }));
    const renewAccessToken = createTokenRenewer({
        readRefresh: async () => current,
        saveRefresh,
        renew,
    });
    return { renewAccessToken, saveRefresh, renew, stored: () => current };
}

describe("createTokenRenewer", () => {
    it("returns the new access token and leaves the refresh token alone when the server does not rotate", async () => {
        const { renewAccessToken, saveRefresh, renew } = setup();
        await expect(renewAccessToken()).resolves.toBe("access-2");
        expect(renew).toHaveBeenCalledWith("refresh-1");
        expect(saveRefresh).not.toHaveBeenCalled();
    });

    it("saves a rotated refresh token and uses it for the next renewal", async () => {
        const { renewAccessToken, saveRefresh, renew, stored } = setup();
        renew.mockResolvedValueOnce({ access: "access-2", refresh: "refresh-2" });
        await renewAccessToken();
        expect(saveRefresh).toHaveBeenCalledWith("refresh-2");
        expect(stored()).toBe("refresh-2");

        await renewAccessToken();
        expect(renew).toHaveBeenLastCalledWith("refresh-2");
    });

    it("does not save the same token again", async () => {
        const { renewAccessToken, saveRefresh, renew } = setup();
        renew.mockResolvedValueOnce({ access: "access-2", refresh: "refresh-1" });
        await renewAccessToken();
        expect(saveRefresh).not.toHaveBeenCalled();
    });

    it("shares one request between overlapping renewals", async () => {
        const { renewAccessToken, renew } = setup();
        let release: (value: Renewal) => void = () => {};
        renew.mockReturnValueOnce(new Promise<Renewal>((resolve) => { release = resolve; }));
        const first = renewAccessToken();
        const second = renewAccessToken();
        release({ access: "access-2", refresh: "refresh-2" });
        await expect(Promise.all([first, second])).resolves.toEqual(["access-2", "access-2"]);
        expect(renew).toHaveBeenCalledTimes(1);
    });

    it("allows a new renewal after a failed one", async () => {
        const { renewAccessToken, renew } = setup();
        renew.mockRejectedValueOnce(new Error("offline"));
        await expect(renewAccessToken()).rejects.toThrow("offline");
        await expect(renewAccessToken()).resolves.toBe("access-2");
    });

    it("does nothing without a stored refresh token", async () => {
        const { renewAccessToken, renew } = setup(null);
        await expect(renewAccessToken()).resolves.toBeNull();
        expect(renew).not.toHaveBeenCalled();
    });
});
