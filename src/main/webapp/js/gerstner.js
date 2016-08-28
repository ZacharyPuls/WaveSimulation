/**
 * Created by zachpuls on 8/27/2016.
 */

$(document).ready(function () {
    (function() {
        var scene; // THREE.js scene object, this contains all of the object meshes, associated materials, lighting information, etc.
        const rendererOptions = {
            antialias: true
        };
        var renderer; // THREE.js renderer object, this contains all of the WebGL rendering hints.
        var camera; // THREE.js camera object, this is used to position the viewer relative to the scene.
        var lights = []; // Array of THREE.js light objects, all of these will be added to the scene and used in rendering.

        const SIZE = 25; // Constant representing the dimensions of the water surface. E.g., for a SIZE of 50, the water surface would contain 50x50 points.
        var waterGeometry;  // Geometry representing the points on the water surface, and their associated heights.
        var waterMesh; // Mesh containing waterGeometry, used to render the surface.
        const waterMaterialProperties = {
            wireframe: true
        };
        const waterMaterial = new THREE.MeshBasicMaterial(waterMaterialProperties); // Material to be used for the water surface mesh.

        function objectExists(obj) {
            return (obj !== null && typeof obj !== 'undefined');
        }

        function start() {
            createCamera();
            createScene();
            createLights();

            waterGeometry = new THREE.Geometry();

            // Initialize all of the points, and set their height to 0.0 (X₀)
            var x;
            var i = 0;
            for (x = 0; x < SIZE; x += 1) {
                var z;
                for (z = 0; z < SIZE; z += 1) {
                    waterGeometry.vertices.push(
                        new THREE.Vector3(x, 0, z)
                    );
                    ++i;
                }
            }

            // Triangulate the set of points, and generate the mesh.
            for (x = 0; x < SIZE - 1; x += 1) {
                var z;
                for (z = 0; z < SIZE - 1; z += 1) {
                    waterGeometry.faces.push(
                        new THREE.Face3((z * SIZE) + x, (z * SIZE) + x + 1, ((z + 1) * SIZE + x)),
                        new THREE.Face3((z * SIZE) + x + 1, ((z + 1) * SIZE) + 1 + x, ((z + 1) * SIZE) + x)
                    );
                }
            }

            waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
            waterMesh.position.set(-SIZE / 2, 0, -SIZE / 2);
            scene.add(waterMesh);

            createRenderer();

            window.addEventListener('resize', onWindowResize, false);

            var container = document.createElement('div');
            document.body.appendChild(container);
            container.appendChild(renderer.domElement);

            window.startTime = new Date();

            updateAnimation();
        }

        function createScene() {
            scene = new THREE.Scene();
        }

        function createCamera() {
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
            camera.position.y = 25;
            camera.position.x = -10;
            camera.position.z = -10;
        }

        function updateCamera() {
            if (!objectExists(camera)) {
                createCamera();
            } else {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
            }
        }

        function createRenderer() {
            renderer = new THREE.WebGLRenderer(rendererOptions);
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function updateRenderer() {
            if (!objectExists(renderer)) {
                createRenderer();
            } else {
                renderer.setSize(window.innerWidth, window.innerHeight);
            }
        }

        function createLights() {
            const AMBIENT_COLOR = 0x404040;
            const DIRECTIONAL_COLOR = 0xFFFFFF;
            const DIRECTIONAL_DIRECTION = new THREE.Vector3(0, 1, 0);

            var ambientLight = new THREE.AmbientLight(AMBIENT_COLOR);
            var directionalLight = new THREE.DirectionalLight(DIRECTIONAL_COLOR);
            directionalLight.position.set(DIRECTIONAL_DIRECTION);

            lights.push(
                ambientLight,
                directionalLight
            );
        }

        function updateLights() {
            if (!objectExists(lights) || lights.isEmpty()) {
                createLights();
            }
            if (!objectExists(scene)) {
                createScene();
            }
            scene.add(lights);
        }


        function onWindowResize() {
            updateCamera();
            updateRenderer();
        }

        function getHeight(x, z, t) {
            return (Math.sin(x / 4 + t) + Math.sin(z / 4 + t)) * 2.5;
        }

        function updateWave() {
            const UPDATE_SPEED = 0.01;
            var t = (new Date() - window.startTime) * 0.06 * UPDATE_SPEED; // 60 fps / 1000 ms per second = .06 ms per frame
            var x;
            for (x = 0; x < SIZE; x += 1) {
                var z;
                for (z = 0; z < SIZE; z += 1) {
                    var xPos = getXPrime(x, z);
                    var yPos = getYPrime(x, z);
                    var vertexIndex = (z * SIZE) + x;
                    waterMesh.geometry.vertices[vertexIndex].setX(xPos.x);
                    waterMesh.geometry.vertices[vertexIndex].setY(yPos);
                    waterMesh.geometry.vertices[vertexIndex].setZ(xPos.y);
                    // waterMesh.geometry.vertices[vertexIndex].setY(getHeight(x, z, t));
                }
            }
            waterMesh.geometry.verticesNeedUpdate = true;
        }

        function updateAnimation() {
            requestAnimationFrame(updateAnimation);
            updateWave();
            renderFrame();
        }

        function renderFrame() {
            camera.lookAt(scene.position);
            renderer.render(scene, camera);
        }

        start();

        var wavelength = 1000;
        var amplitude = 1;
        // const waveVector = new THREE.Vector2(0.5, 0.5);
        var GRAVITATIONAL_CONSTANT = 9.8;

        function getWavelength(i) {
            return $("#wavelength-" + i).val();
        }

        function getAmplitude(i) {
            return $("#amplitude-" + i).val();
        }

        function getWindAngle(i) {
            return $("#windAngle-" + i).val();
        }

        function degToRad(deg) {
            return deg * (Math.PI / 180);
        }
        function getWindDirection(i) {
            var windAngleInRadians = degToRad(getWindAngle(i));
            return new THREE.Vector2(Math.cos(windAngleInRadians), Math.sin(windAngleInRadians));
        }

        function getKMag(i) {
            return (Math.PI * 2.0) / getWavelength(i);
        }

        function getKOverK(i) {
            return getWindDirection(i).divideScalar(getKMag(i));
        }

        function getFrequency(i) {
            return Math.sqrt(9.8 * getKMag(i));
        }

        function getDeltaTime() {
            return (new Date() - window.startTime) / 1000;
        }

        function getXNaught(x, z) {
            return new THREE.Vector2(x, z);
        }

        function getKDotXNaught(x, z, i) {
            return getWindDirection(i).dot(getXNaught(x, z));
        }

        function getWT(i) {
            return getFrequency(i) * getDeltaTime();
        }

        function getXSinusodialComponent(x, z, i) {
            return getAmplitude(i) * Math.sin(getKDotXNaught(x, z, i) - getWT(i));
        }

        function getLastWaveIndex() {
            var $nextWave = $('#sidebar fieldset').last();
            var nextWave = 0;

            if ($nextWave.length === 0) {
                nextWave = 1;
            } else {
                nextWave = parseInt($nextWave.attr('id').split('wave-')[1]) + 1;
            }
            return nextWave;
        }

        function getXPrime(x, z) {
            var xsum = new THREE.Vector2(0, 0);
            var i;
            for (i = 1; i < getLastWaveIndex(); i += 1) {
                xsum.add(getKOverK(i).multiplyScalar(getXSinusodialComponent(x, z, i)));
            }
            console.dir(xsum);
            return getXNaught(x, z).sub(xsum);
        }

        function getYPrime(x, z) {
            var ysum = 0;
            var i;
            for (i = 1; i < getLastWaveIndex(); i += 1) {
                ysum += getAmplitude(i) * Math.cos(getKDotXNaught(x, z, i) - getWT(i));
            }
            return ysum;
        }

    })();
});


