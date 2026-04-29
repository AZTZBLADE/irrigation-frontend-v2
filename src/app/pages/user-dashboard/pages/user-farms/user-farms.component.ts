import {
  Component,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  FarmService,
  Farm,
  GeoJsonFeature,
} from '../../../../core/farm.service';

@Component({
  selector: 'app-user-farms',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-farms.component.html',
  styleUrl: './user-farms.component.scss',
})
export class UserFarmsComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private L: any = null;

  farms: Farm[] = [];
  loading = false;
  error = '';

  showModal = false;
  editingFarmId: number | null = null;

  showMapModal = false;
  map: any = null;

  parcelGeoJson: GeoJsonFeature | undefined = undefined;
  selectionRect: any = null;
  startLatLng: any = null;
  savedLayers: any[] = [];

  showAdviceModal = false;
  selectedFarm: Farm | null = null;
  aiAdvice = '';
  loadingAdvice = false;

  soilProfiles: string[] = ['SANDY', 'LOAMY', 'CLAY', 'SILTY'];

  cropCategories = [
    {
      label: 'Vegetables',
      items: ['Tomato', 'Potato', 'Pepper', 'Onion', 'Carrot', 'Lettuce', 'Cucumber'],
    },
    {
      label: 'Cereals',
      items: ['Corn', 'Wheat', 'Barley', 'Oats', 'Rice', 'Sorghum'],
    },
  ];

  filteredCropCategories: { label: string; items: string[] }[] = [];
  showCropSuggestions = false;

  form = this.fb.group({
    name: ['', Validators.required],
    crop: ['', Validators.required],
    location: ['', Validators.required],
    soilProfile: ['', Validators.required],
    parcelJson: [''],
    image: [''],
  });

  irrigationForm = this.fb.group({
    waterAmount: [2.5, [Validators.required, Validators.min(0)]],
    duration: [45, [Validators.required, Validators.min(1)]],
    debit: [12, [Validators.required, Validators.min(0)]],
  });

  constructor(
    private fb: FormBuilder,
    private farmService: FarmService
  ) {}

  ngOnInit(): void {
    this.loadFarms();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.off();
      this.map.remove();
      this.map = null;
    }
  }

  loadFarms(): void {
    this.loading = true;
    this.error = '';

    this.farmService.getFarms().subscribe({
      next: (res) => {
        this.farms = Array.isArray(res) ? res : [];
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load farms';
        this.loading = false;
      },
    });
  }

  openModal(): void {
    this.editingFarmId = null;
    this.error = '';
    this.parcelGeoJson = undefined;
    this.savedLayers = [];
    this.filteredCropCategories = [];
    this.showCropSuggestions = false;

    this.form.reset({
      name: '',
      crop: '',
      location: '',
      soilProfile: '',
      parcelJson: '',
      image: '',
    });

    this.showModal = true;
  }

  editFarm(farm: Farm): void {
    this.editingFarmId = farm.id ?? null;
    this.error = '';
    this.filteredCropCategories = [];
    this.showCropSuggestions = false;

    this.parcelGeoJson = undefined;

    if (farm.parcelJson) {
      try {
        this.parcelGeoJson = JSON.parse(farm.parcelJson);
      } catch {
        this.parcelGeoJson = undefined;
      }
    }

    this.form.patchValue({
      name: farm.name,
      crop: farm.crop,
      location: farm.location,
      soilProfile: farm.soilProfile,
      parcelJson: farm.parcelJson || '',
      image: farm.image || '',
    });

    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingFarmId = null;
    this.showCropSuggestions = false;
  }

  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = '';

    const raw = this.form.getRawValue();
    const computedSurface = this.getComputedSurface();

    const payload: Farm = {
      name: raw.name || '',
      crop: raw.crop || '',
      location: raw.location || '',
      surface: computedSurface,
      soilProfile: raw.soilProfile || '',
      parcelJson: raw.parcelJson || '',
      image: raw.image || '',
    };

    if (this.editingFarmId !== null) {
      this.farmService.updateFarm(this.editingFarmId, payload).subscribe({
        next: () => {
          this.loading = false;
          this.closeModal();
          this.loadFarms();
        },
        error: (err) => {
          console.error(err);
          this.error = 'Update failed';
          this.loading = false;
        },
      });
    } else {
      this.farmService.createFarm(payload).subscribe({
        next: () => {
          this.loading = false;
          this.closeModal();
          this.loadFarms();
        },
        error: (err) => {
          console.error(err);
          this.error = 'Create failed';
          this.loading = false;
        },
      });
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      this.form.patchValue({
        image: reader.result as string,
      });
    };

    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.form.patchValue({
      image: '',
    });
  }

  deleteFarm(farm: Farm): void {
    if (!farm.id) return;
    if (!confirm('Delete this farm ?')) return;

    this.farmService.deleteFarm(farm.id).subscribe({
      next: () => {
        this.farms = this.farms.filter((f) => f.id !== farm.id);
      },
      error: (err) => {
        console.error(err);
        this.error = 'Delete failed';
      },
    });
  }

  askAdvice(farm: Farm): void {
    if (!farm.id) {
      alert('Farm ID not found');
      return;
    }

    this.selectedFarm = farm;
    this.loadingAdvice = true;
    this.aiAdvice = '';

    this.irrigationForm.reset({
      waterAmount: 2.5,
      duration: 45,
      debit: 12,
    });

    this.farmService.askAdvice(farm).subscribe({
      next: (res) => {
        this.aiAdvice = res?.advice || 'AI advice not available.';
        this.showAdviceModal = true;
        this.loadingAdvice = false;
      },
      error: (err) => {
        console.error(err);
        this.loadingAdvice = false;
        alert('Failed to get AI advice');
      },
    });
  }

  closeAdviceModal(): void {
    this.showAdviceModal = false;
    this.aiAdvice = '';
    this.selectedFarm = null;
  }

  confirmIrrigation(): void {
    if (!this.selectedFarm?.id) return;
    if (this.irrigationForm.invalid) return;

    const raw = this.irrigationForm.getRawValue();

    this.farmService
      .irrigateFarm(this.selectedFarm.id, {
        waterAmount: Number(raw.waterAmount || 0),
        duration: Number(raw.duration || 0),
        debit: Number(raw.debit || 0),
      })
      .subscribe({
        next: (res) => {
          alert(res || 'Irrigation launched successfully');
          this.closeAdviceModal();
        },
        error: (err) => {
          console.error(err);
          alert('Failed to launch irrigation');
        },
      });
  }

  onCropInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value?.trim().toLowerCase() || '';

    if (!value) {
      this.filteredCropCategories = [];
      this.showCropSuggestions = false;
      return;
    }

    this.filteredCropCategories = this.cropCategories
      .map((category) => ({
        label: category.label,
        items: category.items.filter((item) =>
          item.toLowerCase().includes(value)
        ),
      }))
      .filter((category) => category.items.length > 0);

    this.showCropSuggestions = this.filteredCropCategories.length > 0;
  }

  selectCrop(crop: string): void {
    this.form.patchValue({ crop });
    this.filteredCropCategories = [];
    this.showCropSuggestions = false;
  }

  hideCropSuggestions(): void {
    setTimeout(() => {
      this.showCropSuggestions = false;
    }, 150);
  }

  async openMapModal(): Promise<void> {
    this.showMapModal = true;
    if (!this.isBrowser) return;

    setTimeout(async () => {
      await this.initMap();

      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize(true);
          this.loadMapFromExistingGeometry();
        }
      }, 300);
    }, 150);
  }

  closeMapModal(): void {
    this.showMapModal = false;

    if (this.map) {
      this.map.off();
      this.map.remove();
      this.map = null;
    }

    this.selectionRect = null;
    this.startLatLng = null;
  }

  confirmMapLocation(): void {
    if (!this.parcelGeoJson) {
      alert('Draw the farm parcel first.');
      return;
    }

    const parcelString = JSON.stringify(this.parcelGeoJson);
    const computedSurface = this.getComputedSurface();

    this.form.patchValue({
      location: 'Parcel selected on map',
      parcelJson: parcelString,
    });

    alert(`Parcel saved. Computed surface: ${computedSurface.toFixed(2)} m²`);
    this.closeMapModal();
  }

  async initMap(): Promise<void> {
    if (!this.isBrowser) return;

    if (!this.L) {
      const leaflet = await import('leaflet');
      this.L = leaflet;
    }

    const container = document.getElementById('farm-map-modal');
    if (!container) return;

    if (this.map) {
      this.map.off();
      this.map.remove();
      this.map = null;
    }

    container.innerHTML = '';

    this.map = this.L.map(container, {
      center: [36.8065, 10.1815],
      zoom: 13,
      zoomControl: true,
    });

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.installSelectionHandlers();

    setTimeout(() => {
      this.map?.invalidateSize(true);
    }, 300);
  }

  installSelectionHandlers(): void {
    if (!this.map || !this.L) return;

    this.map.on('mousedown', (e: any) => {
      if (e.originalEvent?.button !== 0) return;

      this.startLatLng = e.latlng;

      if (this.selectionRect) {
        this.map.removeLayer(this.selectionRect);
        this.selectionRect = null;
      }

      this.selectionRect = this.L.rectangle(
        [this.startLatLng, this.startLatLng],
        {
          color: '#16a34a',
          weight: 2,
          fillColor: '#22c55e',
          fillOpacity: 0.2,
        }
      ).addTo(this.map);

      this.map.dragging.disable();
    });

    this.map.on('mousemove', (e: any) => {
      if (!this.startLatLng || !this.selectionRect) return;

      const bounds = this.L.latLngBounds(this.startLatLng, e.latlng);
      this.selectionRect.setBounds(bounds);
    });

    this.map.on('mouseup', () => {
      if (!this.startLatLng || !this.selectionRect) {
        this.startLatLng = null;
        this.map.dragging.enable();
        return;
      }

      const bounds = this.selectionRect.getBounds();

      if (
        Math.abs(bounds.getNorth() - bounds.getSouth()) < 0.00001 ||
        Math.abs(bounds.getEast() - bounds.getWest()) < 0.00001
      ) {
        this.map.removeLayer(this.selectionRect);
        this.selectionRect = null;
        this.startLatLng = null;
        this.map.dragging.enable();
        return;
      }

      const geo = this.selectionRect.toGeoJSON() as GeoJsonFeature;
      this.parcelGeoJson = geo;

      this.selectionRect.setStyle({
        color: '#16a34a',
        fillColor: '#22c55e',
        fillOpacity: 0.18,
        weight: 3,
      });

      this.savedLayers.push(this.selectionRect);
      this.selectionRect = null;
      this.startLatLng = null;
      this.map.dragging.enable();

      this.form.patchValue({
        parcelJson: JSON.stringify(this.parcelGeoJson),
      });
    });
  }

  loadMapFromExistingGeometry(): void {
    if (!this.map || !this.L) return;

    this.savedLayers.forEach((layer) => {
      if (this.map.hasLayer(layer)) {
        this.map.removeLayer(layer);
      }
    });
    this.savedLayers = [];

    if (this.selectionRect && this.map.hasLayer(this.selectionRect)) {
      this.map.removeLayer(this.selectionRect);
      this.selectionRect = null;
    }

    if (this.parcelGeoJson) {
      const parcelLayer = this.L.geoJSON(this.parcelGeoJson, {
        style: {
          color: '#16a34a',
          weight: 3,
          fillColor: '#22c55e',
          fillOpacity: 0.18,
        },
      });

      parcelLayer.eachLayer((layer: any) => {
        layer.addTo(this.map);
        this.savedLayers.push(layer);
      });

      if (this.savedLayers.length > 0) {
        const group = this.L.featureGroup(this.savedLayers);
        this.map.fitBounds(group.getBounds(), { padding: [20, 20] });
      }
    }
  }

  clearMapSelection(): void {
    if (!this.map) return;

    this.savedLayers.forEach((layer) => {
      if (this.map.hasLayer(layer)) {
        this.map.removeLayer(layer);
      }
    });

    if (this.selectionRect && this.map.hasLayer(this.selectionRect)) {
      this.map.removeLayer(this.selectionRect);
    }

    this.savedLayers = [];
    this.selectionRect = null;
    this.startLatLng = null;
    this.parcelGeoJson = undefined;

    this.form.patchValue({
      parcelJson: '',
      location: '',
    });
  }

  getComputedSurface(): number {
    if (!this.parcelGeoJson) return 0;
    return Math.round(this.computeFeatureAreaInSquareMeters(this.parcelGeoJson) * 100) / 100;
  }

  private computeFeatureAreaInSquareMeters(feature: GeoJsonFeature): number {
    if (!feature?.geometry || feature.geometry.type !== 'Polygon') return 0;

    const ring = feature.geometry.coordinates?.[0];
    if (!Array.isArray(ring) || ring.length < 4) return 0;

    const earthRadius = 6378137;
    const lat0 =
      ring.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / ring.length;
    const lat0Rad = (lat0 * Math.PI) / 180;

    const points = ring.map((coord: number[]) => {
      const lng = coord[0];
      const lat = coord[1];

      const x = earthRadius * ((lng * Math.PI) / 180) * Math.cos(lat0Rad);
      const y = earthRadius * ((lat * Math.PI) / 180);

      return { x, y };
    });

    let area = 0;

    for (let i = 0; i < points.length - 1; i++) {
      area += points[i].x * points[i + 1].y - points[i + 1].x * points[i].y;
    }

    return Math.abs(area / 2);
  }
}