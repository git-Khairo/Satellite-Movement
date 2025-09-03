import * as THREE from 'three';

export class Earth {
  constructor(name = "earth", position = new THREE.Vector3(0, 0, 0), radius = 100) {
    this.planet = new THREE.Group();
    this.radius = radius;
    this.name = name;
    this.planet.position.copy(position);
    this.draw(name); 
  }

  draw(name) {
    const radius = this.radius;
    const textureLoader = new THREE.TextureLoader();
    const tilt = 0.41;
    const cloudsScale = 1.005;

    let geometry = new THREE.SphereGeometry(radius, 100, 50);


    let textures = this.getTextures(name);


    const material = new THREE.MeshPhongMaterial({
      map: textureLoader.load(textures.map),
      specular: 0x7c7c7c,
      shininess: 15,
    });

    if (textures.specular) {
      material.specularMap = textureLoader.load(textures.specular);
    }
    if (textures.normal) {
      material.normalMap = textureLoader.load(textures.normal);
      material.normalScale = new THREE.Vector2(0.85, -0.85);
    }

    material.map.colorSpace = THREE.SRGBColorSpace;

    this.meshPlanet = new THREE.Mesh(geometry, material);
    this.meshPlanet.rotation.y = 0;
    this.meshPlanet.rotation.z = tilt;
    this.planet.add(this.meshPlanet);


    if (textures.clouds) {
      const materialClouds = new THREE.MeshLambertMaterial({
        map: textureLoader.load(textures.clouds),
        transparent: true,
      });
      materialClouds.map.colorSpace = THREE.SRGBColorSpace;

      this.meshClouds = new THREE.Mesh(geometry, materialClouds);
      this.meshClouds.scale.set(cloudsScale, cloudsScale, cloudsScale);
      this.meshClouds.rotation.z = tilt;
      this.planet.add(this.meshClouds);
    }
  }

  // function to return texture paths for each planet
  getTextures(name) {
    switch (name.toLowerCase()) {
      case "earth":
        return {
          map: "textures/planets/earth_atmos_2048.jpg",
          specular: "textures/planets/earth_specular_2048.jpg",
          normal: "textures/planets/earth_normal_2048.jpg",
          clouds: "textures/planets/earth_clouds_1024.png",
		  specular: 0x7c7c7c,
          shininess: 15,
        };
      case "mars":
        return {
          map: "textures/planets/mars.png",
		 specular: 0x7c7c7c,
         shininess: 15,
        };
      case "moon":
        return {
          map: "textures/planets/moon_1024.jpg",
		  specular: 0x7c7c7c,
          shininess: 15,
        };
      default:
        return {
          map: "textures/planets/earth_atmos_2048.jpg",
		specular: 0x7c7c7c,
         shininess: 15,
        };
    }
  }

  // 🔄 function to change textures dynamically
  changePlanet(name) {
    this.name = name;

    // Remove old meshes
    this.planet.clear();

    // Redraw with new textures
    this.draw(name);
  }

  update() {
    this.planet.rotation.y += 0.002;
  }

  getObject() {
    return this.planet;
  }
}
