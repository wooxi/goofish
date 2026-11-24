"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  id: number;
  name: string;
}

interface RegionSelectorProps {
  province: number;
  city: number;
  district: number;
  onChange: (next: { province: number; city: number; district: number }) => void;
}

export function RegionSelector({ province, city, district, onChange }: RegionSelectorProps) {
  const [provinces, setProvinces] = React.useState<Option[]>([]);
  const [cities, setCities] = React.useState<Option[]>([]);
  const [areas, setAreas] = React.useState<Option[]>([]);

  React.useEffect(() => {
    fetch("/api/dictionaries?type=provinces")
      .then((r) => r.json())
      .then((j) => j.ok && setProvinces(j.data.list));
  }, []);

  React.useEffect(() => {
    if (!province) return;
    fetch(`/api/dictionaries?type=cities&provId=${province}`)
      .then((r) => r.json())
      .then((j) => j.ok && setCities(j.data.list));
  }, [province]);

  React.useEffect(() => {
    if (!city) return;
    fetch(`/api/dictionaries?type=areas&cityId=${city}`)
      .then((r) => r.json())
      .then((j) => j.ok && setAreas(j.data.list));
  }, [city]);

  async function handleProvChange(val: string | null) {
    const provId = Number(val || 110000);
    const cRes = await fetch(`/api/dictionaries?type=cities&provId=${provId}`).then((r) => r.json());
    const cList = (cRes.ok ? cRes.data.list : []) as Option[];
    const firstCity = cList[0]?.id ?? 0;
    let firstArea = 0;
    if (firstCity) {
      const aRes = await fetch(`/api/dictionaries?type=areas&cityId=${firstCity}`).then((r) => r.json());
      const aList = (aRes.ok ? aRes.data.list : []) as Option[];
      firstArea = aList[0]?.id ?? 0;
    }
    onChange({ province: provId, city: firstCity, district: firstArea });
  }

  async function handleCityChange(val: string | null) {
    const cityId = Number(val || 0);
    const aRes = await fetch(`/api/dictionaries?type=areas&cityId=${cityId}`).then((r) => r.json());
    const aList = (aRes.ok ? aRes.data.list : []) as Option[];
    onChange({ province, city: cityId, district: aList[0]?.id ?? 0 });
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <Select value={String(province)} onValueChange={handleProvChange}>
        <SelectTrigger>
          <SelectValue placeholder="省" />
        </SelectTrigger>
        <SelectContent>
          {provinces.map((p) => (
            <SelectItem key={p.id} value={String(p.id)}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={String(city)} onValueChange={handleCityChange}>
        <SelectTrigger>
          <SelectValue placeholder="市" />
        </SelectTrigger>
        <SelectContent>
          {cities.map((c) => (
            <SelectItem key={c.id} value={String(c.id)}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(district)}
        onValueChange={(v) => onChange({ province, city, district: Number(v || 0) })}
      >
        <SelectTrigger>
          <SelectValue placeholder="区/县" />
        </SelectTrigger>
        <SelectContent>
          {areas.map((a) => (
            <SelectItem key={a.id} value={String(a.id)}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
