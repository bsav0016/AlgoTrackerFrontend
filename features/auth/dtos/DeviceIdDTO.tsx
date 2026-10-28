export class DeviceIdDTO {
    deviceId: string;
    platform: string;

    constructor(deviceId: string, platform: string = "") {
        this.deviceId = deviceId
        this.platform = platform
    }

    jsonify() {
        return JSON.stringify({
            device_id: this.deviceId,
            platform: this.platform,
        })
    }
}