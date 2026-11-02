import { useEffect, useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import type { Store } from './store/types'
import { StoreProvider } from './store/context'
import Login from './Login'
import ExercisesScreen from './ExercisesScreen'
import TabLayout from './TabBar'
import TemplateEditor from './TemplateEditor'
import TemplatesScreen from './TemplatesScreen'
import WeekView from './WeekView'
import WorkoutEditor from './WorkoutEditor'

type Props = { store: Store }

export default function App({ store }: Props) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null)

  useEffect(() => {
    store.hasSession().then(setSignedIn)
  }, [store])

  if (signedIn === null) return null

  if (!signedIn) return <Login store={store} onSignedIn={() => setSignedIn(true)} />

  const signOut = async () => {
    await store.signOut()
    setSignedIn(false)
  }

  return (
    <StoreProvider store={store}>
      <HashRouter>
        <Routes>
          <Route path="/workout/:id" element={<WorkoutEditor />} />
          <Route path="/template/:id" element={<TemplateEditor />} />
          <Route element={<TabLayout />}>
            <Route path="/templates" element={<TemplatesScreen />} />
            <Route path="/exercises" element={<ExercisesScreen />} />
            <Route path="*" element={<WeekView onSignOut={signOut} />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  )
}
