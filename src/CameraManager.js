export class CameraManager {
    constructor(camera, satelliteObj, earthObj) {
        this.camera = camera;
        this.satellite = satelliteObj;
        this.earth = earthObj;

        this.mode = 'free'; // 'free', 'follow', 'top'

        window.addEventListener('keydown', (e) => {
            if (e.key === '1') this.mode = 'free';
            if (e.key === '2') this.mode = 'follow';
            if (e.key === '3') this.mode = 'top';
        });

        // Initial camera setup
        const radius = this.earth.radius;
        this.camera.position.set(0, radius * 0.2, radius * 3);
        this.camera.lookAt(this.earth.getObject().position);
    }

    update() {
        const satPos = this.satellite.getObject().position;

        if (this.mode === 'follow') {
            this.camera.position.lerp(satPos.clone().add(new THREE.Vector3(0, 1000000, 1500000)), 0.05);
            this.camera.lookAt(satPos);
        } else if (this.mode === 'top') {
            this.camera.position.set(satPos.x, satPos.y + 8000000, satPos.z);
            this.camera.lookAt(satPos);
        } // 'free' mode: leave OrbitControls in control
    }
}
