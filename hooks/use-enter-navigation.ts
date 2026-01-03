
import { useEffect, useRef } from 'react'

export function useEnterNavigation() {
    const formRef = useRef<HTMLFormElement>(null)

    useEffect(() => {
        const form = formRef.current
        if (!form) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Enter') return

            const target = e.target as HTMLElement
            if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return

            // Allow default behavior for textarea if shift is pressed (new line)
            if (target.tagName === 'TEXTAREA' && !e.ctrlKey) return

            e.preventDefault()

            const formElements = Array.from(form.querySelectorAll('input, select, textarea, button[type="submit"]')) as HTMLElement[]

            // Filter out hidden, disabled, or tabIndex=-1 elements
            const focusable = formElements.filter(el => {
                return !el.hasAttribute('disabled') &&
                    !el.getAttribute('aria-hidden') &&
                    el.offsetParent !== null &&
                    el.tabIndex !== -1
            })

            const index = focusable.indexOf(target)

            if (index > -1 && index < focusable.length - 1) {
                const next = focusable[index + 1]
                next.focus()
            } else {
                // It's the last element, modify to submit
                // If the target is the submit button itself, default behavior happens.
                // If target is an input and it's the last one, we want to submit.
                // React Hook Form's handleSubmit often expects a proper submit event.
                // We can trigger a synthetic submit or click the submit button.

                const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement
                if (submitBtn) {
                    submitBtn.click()
                } else {
                    form.requestSubmit()
                }
            }
        }

        form.addEventListener('keydown', handleKeyDown)
        return () => {
            form.removeEventListener('keydown', handleKeyDown)
        }
    }, [])

    return formRef
}
