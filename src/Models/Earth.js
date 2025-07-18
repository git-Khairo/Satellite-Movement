import * as THREE from 'three';


export class Earth{

    constructor(position = new THREE.Vector3(0, 0, 0),radius = 0) {
    this.earth = new THREE.Group();
    this.radius=radius
    this.earth.position.copy(position);
    this.draw(); // construct geometry
    }


    draw(){
        const radius = this.radius;
        const textureLoader = new THREE.TextureLoader();
        const tilt = 0.41;

		const cloudsScale = 1.005;

		let geometry, meshPlanet, meshClouds;
				// planet
				const materialNormalMap = new THREE.MeshPhongMaterial( {

					specular: 0x7c7c7c,
					shininess: 15,
					map: textureLoader.load( 'textures/planets/earth_atmos_2048.jpg' ),
					specularMap: textureLoader.load( 'textures/planets/earth_specular_2048.jpg' ),
					normalMap: textureLoader.load( 'textures/planets/earth_normal_2048.jpg' ),

					// y scale is negated to compensate for normal map handedness.
					normalScale: new THREE.Vector2( 0.85, - 0.85 )

				} );
				materialNormalMap.map.colorSpace = THREE.SRGBColorSpace;

				geometry = new THREE.SphereGeometry( radius, 100, 50 );

				meshPlanet = new THREE.Mesh( geometry, materialNormalMap );
				meshPlanet.rotation.y = 0;
				meshPlanet.rotation.z = tilt;
				this.earth.add(meshPlanet);

				// clouds

				const materialClouds = new THREE.MeshLambertMaterial( {

					map: textureLoader.load( 'textures/planets/earth_clouds_1024.png' ),
					transparent: true

				} );
				materialClouds.map.colorSpace = THREE.SRGBColorSpace;

				meshClouds = new THREE.Mesh( geometry, materialClouds );
				meshClouds.scale.set( cloudsScale, cloudsScale, cloudsScale );
				meshClouds.rotation.z = tilt;
				this.earth.add( meshClouds );

    }


    update() {
    this.earth.rotation.y += 0.002;
    }

    getObject() {
    return this.earth;
    }



}