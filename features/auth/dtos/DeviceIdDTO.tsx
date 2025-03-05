export class DeviceIdDTO {
    deviceId: string;

    constructor(deviceId: string) {
        this.deviceId = deviceId
    }

    jsonify() {
        return JSON.stringify({
            device_id: this.deviceId,
        })
    }
}