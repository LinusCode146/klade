import { mount } from 'svelte'
import '@fontsource/pixelify-sans/400.css'
import '@fontsource/pixelify-sans/700.css'
import '@fontsource/silkscreen/400.css'
import './app.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
