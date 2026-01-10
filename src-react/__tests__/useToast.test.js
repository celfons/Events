/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useToast } from '../hooks/useToast';

describe('useToast hook', () => {
  it('adds a toast when showToast is called', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('Test message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Test message');
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('removes a toast when removeToast is called', () => {
    const { result } = renderHook(() => useToast());

    let toastId;
    act(() => {
      toastId = result.current.showSuccess('Test message');
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('supports different toast types', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('Success');
      result.current.showError('Error');
      result.current.showInfo('Info');
      result.current.showWarning('Warning');
    });

    expect(result.current.toasts).toHaveLength(4);
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[1].type).toBe('error');
    expect(result.current.toasts[2].type).toBe('info');
    expect(result.current.toasts[3].type).toBe('warning');
  });
});
