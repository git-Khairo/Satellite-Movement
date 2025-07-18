// SatellitePhysicsSimulator.js
import * as THREE from 'three';

export class PhysicsEngine {
    constructor(scene, earthObj, satelliteObj) {
        this.scene = scene;

        this.earthRadius = 6371000; // in meters
        this.earthMass = 5.972e24; // in kg
        this.G = 6.67430e-11; // gravitational constant
        this.airDensity = 1e-12; // approx. at 600km

        this.dragCoefficient = 0.47; // sphere drag
        this.satelliteArea = Math.PI * Math.pow(2, 2); // cross-section area

        this.earth = earthObj;
        this.satellite = satelliteObj;

        this.position = satelliteObj.getObject().position.clone();

        // Auto-calculated tangential orbital velocity
        const rVec = this.position.clone().sub(this.earth.getObject().position);
        const r = rVec.length();
        const speed = Math.sqrt(this.G * this.earthMass / r);
        const tangent = new THREE.Vector3().crossVectors(rVec, new THREE.Vector3(0, 1, 0)).normalize();
        this.velocity = tangent.multiplyScalar(speed);

        this.mass = 500;
        this.pathPoints = [];
        this.pathMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
    }

    computeGravity() {
        const rVec = new THREE.Vector3().subVectors(this.earth.getObject().position, this.position);
        const distanceSq = rVec.lengthSq();
        const forceMag = (this.G * this.earthMass * this.mass) / distanceSq;
        return rVec.normalize().multiplyScalar(forceMag);
    }

    computeDrag() {
        const speed = this.velocity.length();
        const dragMag = 0.5 * this.airDensity * speed * speed * this.dragCoefficient * this.satelliteArea;
        return this.velocity.clone().normalize().multiplyScalar(-dragMag);
    }

    update(dt) {
        const Fg = this.computeGravity();
        const Fd = this.computeDrag();
        const Fnet = Fg.add(Fd);

        const acc = Fnet.clone().divideScalar(this.mass);
        this.velocity.add(acc.clone().multiplyScalar(dt));
        this.position.add(this.velocity.clone().multiplyScalar(dt));

        this.satellite.getObject().position.copy(this.position);

        this.pathPoints.push(this.position.clone());
        if (this.pathPoints.length > 2000) this.pathPoints.shift();
        const geometry = new THREE.BufferGeometry().setFromPoints(this.pathPoints);
        const pathLine = new THREE.Line(geometry, this.pathMaterial);
        this.scene.add(pathLine);
    }

    applyThrust(deltaV) {
        const direction = this.velocity.clone().normalize();
        this.velocity.add(direction.multiplyScalar(deltaV));
        console.log(`Thrust applied: Δv = ${deltaV.toFixed(2)} m/s`);
    }

    performOrbitalTransfer(newAltitude) {
        const r1 = this.position.length();
        const r2 = this.earthRadius + newAltitude;
        const mu = this.G * this.earthMass;

        if (r2 < this.earthRadius) {
            console.warn('Invalid orbit: altitude below Earth surface.');
            return;
        }

        // First burn: transfer to elliptical orbit
        const vCurrent = this.velocity.length();
        const vTransfer = Math.sqrt(mu * ((2 * r2) / (r1 + r2)));
        const deltaV1 = vTransfer - vCurrent;
        this.applyThrust(deltaV1);
        console.log(`Orbital transfer initiated to altitude ${newAltitude / 1000} km`);
    }
}
