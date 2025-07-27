import * as THREE from 'three';
import { showCrashWarning } from '../main';

export class PhysicsEngine {
    constructor(scene, earthObj, satelliteObj) {
        this.scene = scene;

        this.earthRadius = 6371000;
        this.earthMass = 5.972e24;
        this.G = 6.67430e-11;
        this.airDensity = 1e-12;

        this.dragCoefficient = 0.47;
        this.satelliteArea = Math.PI * Math.pow(2, 2);

        this.earth = earthObj;
        this.satellite = satelliteObj;

        this.position = satelliteObj.getObject().position.clone();

        const rVec = this.position.clone().sub(this.earth.getObject().position);
        const r = rVec.length();
        const speed = Math.sqrt(this.G * this.earthMass / r);
        const tangent = new THREE.Vector3().crossVectors(rVec, new THREE.Vector3(0, 1, 0)).normalize();
        this.velocity = tangent.multiplyScalar(speed);

        this.mass = 500;
        this.pathPoints = [];
        this.pathMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff });

        this.circularizationPending = false;
        this.r2 = null;

        this._acceleration = new THREE.Vector3();
        this._gravityForce = new THREE.Vector3();
        this._dragForce = new THREE.Vector3();

        // Create orbit type info element
        this.infoBox = document.getElementById('debug');
    }

    computeGravity() {
        const rVec = new THREE.Vector3().subVectors(this.earth.getObject().position, this.position);
        const distanceSq = rVec.lengthSq();
        const forceMag = (this.G * this.earthMass * this.mass) / distanceSq;
        this._gravityForce = rVec.normalize().multiplyScalar(forceMag);
        return this._gravityForce;
    }

    computeDrag() {
        const speed = this.velocity.length();
        const dragMag = 0.5 * this.airDensity * speed * speed * this.dragCoefficient * this.satelliteArea;
        this._dragForce = this.velocity.clone().normalize().multiplyScalar(-dragMag);
        return this._dragForce;
    }

    getAcceleration() {
        return this._acceleration.clone();
    }

    getGravityForce() {
        return this._gravityForce.clone();
    }

    getDragForce() {
        return this._dragForce.clone();
    }

    update(dt, isPath) {
        const currentAltitude = this.position.length() - this.earthRadius;

        // Warn if altitude too low
        if (currentAltitude < 200000 && !this.lowAltitudeWarned) {
            const warnMsg = `⚠️ Satellite dangerously low: ${Math.round(currentAltitude / 1000)} km!`;
            console.warn(warnMsg);
            if (this.infoBox) this.infoBox.innerText += `\n${warnMsg}`;
            this.lowAltitudeWarned = true;

            if (typeof showCrashWarning === 'function') {
                showCrashWarning();
            }
        }

        const Fg = this.computeGravity();
        const Fd = this.computeDrag();
        const Fnet = Fg.add(Fd);

        this._acceleration = Fnet.clone().divideScalar(this.mass);
        this.velocity.add(this._acceleration.clone().multiplyScalar(dt));
        this.position.add(this.velocity.clone().multiplyScalar(dt));

        this.satellite.getObject().position.copy(this.position);

        // CRASH CHECK
        if (this.position.length() <= this.earthRadius) {
            const crashMsg = '💥 Satellite has crashed into Earth!';
            console.warn(crashMsg);
            if (this.infoBox) this.infoBox.innerText += `\n${crashMsg}`;
            this.satellite.getObject().visible = false;
            this.velocity.set(0, 0, 0);
            this.pathPoints = [];
            return;
        }

        const mu = this.G * this.earthMass;
        const r = this.position.length();
        const v = this.velocity.length();
        const energy = 0.5 * v * v - mu / r;
        let orbitType = 'Elliptical';
        if (Math.abs(energy) < 1e3) orbitType = 'Parabolic';
        else if (energy > 0) orbitType = 'Hyperbolic';

        this.pathPoints.push(this.position.clone());
        if (this.pathPoints.length > 2000) this.pathPoints.shift();
        const geometry = new THREE.BufferGeometry().setFromPoints(this.pathPoints);
        if(isPath){
            const pathLine = new THREE.Line(geometry, this.pathMaterial);
            this.scene.add(pathLine);
        }

        if (this.circularizationPending && Math.abs(this.position.length() - this.r2) < 1000) {
            this.circularize();
            this.circularizationPending = false;
        }
    }

    applyThrust(deltaV) {
        const direction = this.velocity.clone().normalize();
        this.velocity.add(direction.multiplyScalar(deltaV));
        console.log(`Thrust applied: Δv = ${deltaV.toFixed(2)} m/s`);

        const mu = this.G * this.earthMass;
        const r = this.position.length();
        const v = this.velocity.length();
        const escapeVelocity = Math.sqrt(2 * mu / r);
        if (v >= escapeVelocity) {
            console.warn('⚠️ Satellite has reached or exceeded escape velocity! It may leave orbit.');
        }
    }

    performOrbitalTransfer(newAltitude) {
        const r1 = this.position.length();
        const r2 = this.earthRadius + newAltitude;
        const mu = this.G * this.earthMass;

        if (r2 < this.earthRadius) {
            console.warn('Invalid orbit: altitude below Earth surface.');
            return;
        }

        const a = 0.5 * (r1 + r2);
        const vTransfer = Math.sqrt(mu * (2 / r1 - 1 / a));
        const vCurrent = this.velocity.length();
        const deltaV1 = vTransfer - vCurrent;
        this.applyThrust(deltaV1);
        this.circularizationPending = true;
        this.r2 = r2;
        console.log(`Initiating transfer to ${newAltitude / 1000} km: Δv = ${deltaV1.toFixed(2)} m/s`);
    }

    circularize() {
        const mu = this.G * this.earthMass;
        const r = this.position.length(); // Use current position's radius
        const vCirc = Math.sqrt(mu / r); // Circular orbit velocity at current radius
        const direction = this.velocity.clone().normalize(); // Maintain current orbital plane
        const vCurrent = this.velocity.length();
        const deltaV2 = vCirc - vCurrent;
        this.velocity.copy(direction.multiplyScalar(vCirc)); // Set velocity magnitude to circular orbit velocity
        console.log(`Orbit circularized at ${(r - this.earthRadius) / 1000} km: Δv = ${deltaV2.toFixed(2)} m/s`);
        this.pathPoints = []; // Clear path to start fresh orbit trail
    }

    createInclinedOrbit(inclinationDeg, altitude = 500_000, type = "circular") {
        const inclination = THREE.MathUtils.degToRad(inclinationDeg);
        const r = this.earthRadius + altitude;
        const mu = this.G * this.earthMass;

        // Satellite starts at x-axis
        this.position.set(r, 0, 0);

        // Rotate velocity direction around Z by inclination angle to get orbital plane
        const speed = type === 'circular' ? Math.sqrt(mu / r)
                    : Math.sqrt(mu * (2 / r - 1 / ((r + r * 1.5) / 2))); // elliptical approx

        const vx = 0;
        const vy = speed * Math.cos(inclination);
        const vz = speed * Math.sin(inclination);
        this.velocity.set(vx, vy, vz);

        this.satellite.getObject().position.copy(this.position);
        this.pathPoints = [];

        console.log(`🔁 ${type} orbit with inclination: ${inclinationDeg}°, altitude: ${altitude / 1000} km`);
    }

    changeOrbitType(type, value) {
        const r1 = this.position.length();
        const mu = this.G * this.earthMass;

        if (type === 'circular') {
            const targetRadius = this.earthRadius + value;
            const vCirc = Math.sqrt(mu / targetRadius);
            const direction = this.velocity.clone().normalize();
            this.velocity = direction.multiplyScalar(vCirc);
            this.position.setLength(targetRadius);
            this.satellite.getObject().position.copy(this.position);
            console.log(`✅ Circular orbit set at ${value / 1000} km altitude.`);
        }

        else if (type === 'elliptical') {
            const r2 = this.earthRadius + value;
            const a = 0.5 * (r1 + r2);
            const vTransfer = Math.sqrt(mu * (2 / r1 - 1 / a));
            const direction = this.velocity.clone().normalize();
            this.velocity = direction.multiplyScalar(vTransfer);
            console.log(`✅ Elliptical transfer orbit set: periapsis=${(r1 - this.earthRadius) / 1000} km, apoapsis=${value / 1000} km.`);
        }

        else if (type === 'escape') {
            const escapeV = Math.sqrt(2 * mu / r1);
            const direction = this.velocity.clone().normalize();
            this.velocity = direction.multiplyScalar(escapeV * 1.05); // slightly above escape speed
            console.log(`🚀 Escape orbit initiated with Δv = ${(escapeV * 1.05 - this.velocity.length()).toFixed(2)} m/s`);
        }

        else {
            console.warn('❌ Invalid orbit type. Use: "circular", "elliptical", or "escape".');
        }

        // Reset orbit history for clean path rendering
        this.pathPoints = [];
    }
}