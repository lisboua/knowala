export interface Avatar {
  id: string
  name: string
  path: string
}

export const AVATARS: Avatar[] = [
  { id: 'fox', name: 'Raposa', path: '/avatars/fox.svg' },
  { id: 'owl', name: 'Coruja', path: '/avatars/owl.svg' },
  { id: 'bear', name: 'Urso', path: '/avatars/bear.svg' },
  { id: 'cat', name: 'Gato', path: '/avatars/cat.svg' },
  { id: 'dog', name: 'Cachorro', path: '/avatars/dog.svg' },
  { id: 'rabbit', name: 'Coelho', path: '/avatars/rabbit.svg' },
  { id: 'panda', name: 'Panda', path: '/avatars/panda.svg' },
  { id: 'penguin', name: 'Pinguim', path: '/avatars/penguin.svg' },
  { id: 'koala', name: 'Coala', path: '/avatars/koala.svg' },
  { id: 'deer', name: 'Cervo', path: '/avatars/deer.svg' },
  { id: 'wolf', name: 'Lobo', path: '/avatars/wolf.svg' },
  { id: 'turtle', name: 'Tartaruga', path: '/avatars/turtle.svg' },
  { id: 'frog', name: 'Sapo', path: '/avatars/frog.svg' },
  { id: 'bee', name: 'Abelha', path: '/avatars/bee.svg' },
  { id: 'butterfly', name: 'Borboleta', path: '/avatars/butterfly.svg' },
  { id: 'tree', name: 'Árvore', path: '/avatars/tree.svg' },
]

export function isValidAvatar(path: string): boolean {
  return AVATARS.some((a) => a.path === path)
}
