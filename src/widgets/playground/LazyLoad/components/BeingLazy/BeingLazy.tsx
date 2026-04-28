"use client";

const MassiveData = Array.from({ length: 100000 }, (_, i) => `Item ${i + 1}`);

export function BeingLazy() {
  return (
    <div>
      <h2>Being Lazyy</h2>
      <ul>
        {MassiveData.slice(0, 10).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default BeingLazy;
