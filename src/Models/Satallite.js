import * as THREE from 'three';

export class Satellite {
    
    constructor(position = new THREE.Vector3(0, 0, 0)) {
    this.satellite = new THREE.Group();
    this.satellite.position.copy(position);
    this.draw(); // construct geometry
    }


    draw(){
    

    const textureLoader = new THREE.TextureLoader();
    // === Main body (cylinder) ===
        const bodyMat = new THREE.MeshStandardMaterial({ 
            map: textureLoader.load( 'textures/satellite/metal.jpeg' ),
            metalness: 0.6,
            roughness: 0.3
        });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 3, 32), bodyMat);
        body.castShadow = body.receiveShadow = true;
        body.rotation.x = Math.PI / 2;
        this.satellite.add(body);
        
    // === Solar Panel Arms ===
        const armMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.7, 8);
        const leftArm = new THREE.Mesh(armGeo, armMat);
        leftArm.position.set(-1.2, 0, 0);
        leftArm.rotation.z = Math.PI / 2;
        const rightArm = leftArm.clone();
        rightArm.position.set(1.2, 0, 0);
        this.satellite.add(leftArm, rightArm);
        
    // === Solar Panels ===
        const panelMat = new THREE.MeshStandardMaterial({
            map: textureLoader.load( 'textures/satellite/solare_panel.jpeg' ),
            emissive: 0x111144,
            roughness: 0.6,
            metalness: 0.3,
        });
        const panelGeo = new THREE.BoxGeometry(0.1, 2.5, 5);
        const leftPanel = new THREE.Mesh(panelGeo, panelMat);
        leftPanel.position.set(-2.6, 0, 0);
        const rightPanel = leftPanel.clone();
        rightPanel.position.set(2.6, 0, 0);
        leftPanel.castShadow = leftPanel.receiveShadow = true;
        this.satellite.add(leftPanel, rightPanel);
        
    // === Antenna Dish ===
        const dishGeo = new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI);
        const dishMat = new THREE.MeshStandardMaterial({ 
            map: textureLoader.load( 'textures/satellite/dish.jpeg' ),
            metalness: 0.4,
            roughness: 0.2 
        });
        const dish = new THREE.Mesh(dishGeo, dishMat);
        dish.rotation.x = Math.PI;
        dish.position.set(0, 0.25, 2);
        this.satellite.add(dish);
        
    // Dish arm
        const dishArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1), armMat);
        dishArm.position.set(0, 0, 1.3);
        dish.castShadow = true;
        this.satellite.add(dishArm);
        
    // === Camera/Sensor Module ===
        const sensorBody = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.8, 16), new THREE.MeshStandardMaterial({ color: 0x222222 }));
        sensorBody.rotation.z = Math.PI / 2;
        sensorBody.position.set(0, 0.8, -1.2);
        this.satellite.add(sensorBody);
        
    // === Thrusters ===
    const thrusterMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
    for (let i = -1; i <= 1; i += 2) {
            const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.4, 12), thrusterMat);
            thruster.rotation.z = Math.PI / 2;
            thruster.position.set(i * 0.5, -0.6, -1.4);
            this.satellite.add(thruster);
    }
    }


    update() {
    this.satellite.rotation.y += 0.002;
    }

    getObject() {
    return this.satellite;
    }


}