# React Performance Guidelines

## useCallback Usage Standards

### When to Use useCallback

Use `useCallback` in the following scenarios:

1. **Functions passed as props to memoized components**
   ```typescript
   const MemoizedChild = React.memo(ChildComponent);

   function Parent() {
     const handleClick = useCallback(() => {
       // Logic here
     }, [dependencies]);

     return <MemoizedChild onClick={handleClick} />;
   }
   ```

2. **Functions used as dependencies in other hooks**
   ```typescript
   const fetchData = useCallback(async () => {
     // Fetch logic
   }, [id]);

   useEffect(() => {
     fetchData();
   }, [fetchData]); // fetchData is stable reference
   ```

3. **Functions in custom hooks that will be returned and used as dependencies**
   ```typescript
   export function useCustomHook() {
     const doSomething = useCallback(() => {
       // Logic
     }, []);

     return { doSomething }; // Consumers may use this in useEffect
   }
   ```

4. **Event handlers in components with expensive renders**
   ```typescript
   function ExpensiveComponent({ items }: { items: LargeArray }) {
     const handleItemClick = useCallback((id: string) => {
       // Handle click
     }, []);

     return items.map(item => (
       <ExpensiveItem key={item.id} onClick={() => handleItemClick(item.id)} />
     ));
   }
   ```

### When NOT to Use useCallback

1. **Simple event handlers that don't cause re-renders**
   ```typescript
   // ❌ Unnecessary - adds overhead without benefit
   const handleClick = useCallback(() => {
     console.log('clicked');
   }, []);

   // ✅ Better - simpler and clearer
   const handleClick = () => {
     console.log('clicked');
   };
   ```

2. **Functions that are only called once (e.g., in a single useEffect)**
   ```typescript
   // ❌ Unnecessary
   const initialize = useCallback(() => {
     // Setup logic
   }, []);

   useEffect(() => {
     initialize();
   }, [initialize]);

   // ✅ Better - inline or extract outside component
   useEffect(() => {
     // Setup logic directly
   }, []);
   ```

3. **When the function body is very simple**
   ```typescript
   // ❌ useCallback overhead > function overhead
   const add = useCallback((a: number, b: number) => a + b, []);

   // ✅ Just define it
   const add = (a: number, b: number) => a + b;
   ```

## useMemo Usage Standards

### When to Use useMemo

1. **Expensive calculations**
   ```typescript
   const sortedItems = useMemo(() => {
     return items.sort((a, b) => a.value - b.value);
   }, [items]);
   ```

2. **Creating objects/arrays to prevent referential inequality**
   ```typescript
   const options = useMemo(() => ({
     value: searchTerm,
     caseSensitive: true
   }), [searchTerm]);
   ```

### When NOT to Use useMemo

1. **Simple operations**
   ```typescript
   // ❌ Unnecessary
   const fullName = useMemo(() => `${firstName} ${lastName}`, [firstName, lastName]);

   // ✅ Better
   const fullName = `${firstName} ${lastName}`;
   ```

## React.memo Usage Standards

### When to Use React.memo

1. **Pure components that receive complex props**
   ```typescript
   const ExpensiveComponent = React.memo(({ data, onAction }: Props) => {
     // Complex rendering logic
   });
   ```

2. **Components that render frequently with same props**
   ```typescript
   const ListItem = React.memo(({ item }: { item: Item }) => {
     return <div>{item.name}</div>;
   });
   ```

### When NOT to Use React.memo

1. **Components that always render with different props**
2. **Very simple components (overhead > benefit)**
3. **Components that change frequently anyway**

## Performance Checklist

Before optimizing, ask:
- [ ] Is there a measurable performance problem?
- [ ] Have I profiled with React DevTools?
- [ ] Is the optimization necessary or premature?
- [ ] Does the optimization make the code more complex?
- [ ] Have I measured the improvement?

## Best Practices

1. **Measure before optimizing** - Use React DevTools Profiler
2. **Keep it simple** - Don't optimize prematurely
3. **Be consistent** - Follow these guidelines across the codebase
4. **Document exceptions** - If you deviate, explain why in comments
5. **Profile in production mode** - Development mode is slower

## Examples from Our Codebase

### ✅ Good: Custom Hook with useCallback
```typescript
// apps/frontend/app/dashboard/projects/[id]/hooks/useProjectFiles.ts
export function useProjectFiles(projectId: string) {
  const fetchFiles = useCallback(async () => {
    // This function is returned and used in useEffect by consumers
    const { data } = await api.get(`/files/project/${projectId}`);
    setFiles(data.data || []);
  }, [projectId]);

  return { fetchFiles };
}
```

### ✅ Good: Event Handler without useCallback
```typescript
// Simple component with infrequent re-renders
function SimpleButton() {
  const handleClick = () => {
    console.log('clicked');
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

### ❌ Bad: Unnecessary useCallback
```typescript
// Component re-renders frequently anyway, useCallback adds no value
function Counter() {
  const [count, setCount] = useState(0);

  // ❌ Unnecessary - component re-renders on every count change
  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  return <button onClick={increment}>{count}</button>;
}
```

## References

- [React Documentation: useCallback](https://react.dev/reference/react/useCallback)
- [React Documentation: useMemo](https://react.dev/reference/react/useMemo)
- [When to useMemo and useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)
