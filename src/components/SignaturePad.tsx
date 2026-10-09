import React, { useEffect, useRef } from 'react'
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form'
import type { TemplateField, TemplateFormData } from '../types/template.types'

interface SignaturePadProps {
  field: TemplateField
  value: unknown
  error?: { message?: unknown }
  register: UseFormRegister<TemplateFormData>
  setValue: UseFormSetValue<TemplateFormData>
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  field,
  value,
  error,
  register,
  setValue
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const hasStrokeRef = useRef(false)
  const signatureValue = typeof value === 'string' ? value : ''
  const registration = register(field.id, field.validation)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    if (!signatureValue.startsWith('data:image/png;base64,')) {
      if (!isDrawingRef.current) context.clearRect(0, 0, canvas.width, canvas.height)
      return
    }

    context.clearRect(0, 0, canvas.width, canvas.height)
    const image = new Image()
    image.onload = () => context.drawImage(image, 0, 0, canvas.width, canvas.height)
    image.onerror = () => console.error('Unable to restore the saved signature image')
    image.src = signatureValue
  }, [signatureValue])

  const updateSignature = (nextValue: string) => {
    setValue(field.id as keyof TemplateFormData, nextValue, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    })
  }

  const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget
    const bounds = canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
      y: ((event.clientY - bounds.top) / bounds.height) * canvas.height
    }
  }

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    const context = event.currentTarget.getContext('2d')
    if (!context) return

    updateSignature('')
    hasStrokeRef.current = false
    context.clearRect(0, 0, event.currentTarget.width, event.currentTarget.height)
    const point = getCanvasPoint(event)
    context.strokeStyle = '#1b1b1b'
    context.lineWidth = 5
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.beginPath()
    context.moveTo(point.x, point.y)
    isDrawingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const continueDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    const context = event.currentTarget.getContext('2d')
    if (!context) return

    const point = getCanvasPoint(event)
    context.lineTo(point.x, point.y)
    context.stroke()
    hasStrokeRef.current = true
  }

  const finishDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    if (hasStrokeRef.current) {
      updateSignature(event.currentTarget.toDataURL('image/png'))
    }
  }

  const clearSignature = () => {
    isDrawingRef.current = false
    hasStrokeRef.current = false
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height)
    updateSignature('')
  }

  return (
    <div className="compact-field full-width signature-field">
      <input type="hidden" id={field.id} {...registration} />
      <p className="signature-field-label" id={`${field.id}-label`}>{field.label}</p>
      <p className="signature-instructions">Draw your handwritten signature in the box below.</p>
      <div className="signature-pad-shell">
        <canvas
          ref={canvasRef}
          className="signature-pad-canvas"
          width={1200}
          height={120}
          aria-label="Draw your signature here"
          aria-describedby={`${field.id}-label`}
          onPointerDown={startDrawing}
          onPointerMove={continueDrawing}
          onPointerUp={finishDrawing}
          onPointerCancel={finishDrawing}
        />
      </div>
      <button type="button" className="signature-clear-button" onClick={clearSignature}>
        Clear signature
      </button>
      {error && <span className="error-message" role="alert">{String(error.message)}</span>}
    </div>
  )
}
