/// <reference types="@react-three/fiber" />
/// <reference types="three" />

import { Object3DNode } from '@react-three/fiber'
import { AmbientLight, DirectionalLight, Group, Mesh, SphereGeometry, BoxGeometry, CylinderGeometry, MeshStandardMaterial } from 'three'

declare module '@react-three/fiber' {
  interface ThreeElements {
    ambientLight: Object3DNode<AmbientLight, typeof AmbientLight>
    directionalLight: Object3DNode<DirectionalLight, typeof DirectionalLight>
    group: Object3DNode<Group, typeof Group>
    mesh: Object3DNode<Mesh, typeof Mesh>
    sphereGeometry: Object3DNode<SphereGeometry, typeof SphereGeometry>
    boxGeometry: Object3DNode<BoxGeometry, typeof BoxGeometry>
    cylinderGeometry: Object3DNode<CylinderGeometry, typeof CylinderGeometry>
    meshStandardMaterial: Object3DNode<MeshStandardMaterial, typeof MeshStandardMaterial>
  }
} 


