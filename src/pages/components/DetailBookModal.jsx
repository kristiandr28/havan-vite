import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { BiCalendar, BiMapPin, BiPhone, BiNote, BiCheck, BiUser } from 'react-icons/bi';

// Komponen-komponen berikut adalah tiruan (mock) untuk tujuan demonstrasi.
// Dalam aplikasi nyata, Anda akan mengimpornya dari file terpisah.

/**
 * Komponen Modal untuk validasi sebelum submit final.
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.closeModal
 * @param {Function} props.onConfirm
 * @param {boolean} props.isSubmitting
 */
const ValidationModal = ({ isOpen, closeModal, onConfirm, isSubmitting }) => {
	if (!isOpen) return null;
	return (
		<div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10004]">
			<div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-auto">
				<h3 className="text-lg font-semibold text-havanaGray mb-4">Konfirmasi Pemesanan</h3>
				<p className="text-sm text-gray-700 mb-6">Apakah Anda yakin ingin melanjutkan dengan pemesanan ini?</p>
				<div className="flex justify-end space-x-2">
					<button onClick={closeModal} className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-300">
						Batal
					</button>
					<button onClick={onConfirm} className="py-2 px-4 bg-havanaBlue text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-400" disabled={isSubmitting}>
						{isSubmitting ? 'Mengonfirmasi...' : 'Konfirmasi'}
					</button>
				</div>
			</div>
		</div>
	);
};

/**
 * Komponen Modal untuk menampilkan konfirmasi pemesanan setelah berhasil.
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.closeModal
 * @param {object} props.booking
 * @param {string} props.modalType
 * @param {object} props.activeCurrency
 * @param {Function} props.openTicketModal
 */
const DetailConfirmBookingModal = ({ isOpen, closeModal, booking, modalType, activeCurrency }) => {
	if (!isOpen || !booking) return null;
	return (
		<div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10005]">
			<div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg mx-auto max-h-[80vh] overflow-y-auto">
				<h3 className="text-lg font-semibold text-havanaBlue mb-4">Pemesanan Dikonfirmasi!</h3>
				<p className="text-sm text-gray-700 mb-4">Pemesanan Anda untuk **{booking.itemName}** telah berhasil. Berikut adalah detailnya:</p>
				<div className="space-y-4">
					{booking.details.map((detail, index) => (
						<div key={index} className="p-4 bg-gray-50 rounded-lg">
							<h4 className="text-sm font-semibold text-havanaGray mb-2">Tiket {index + 1}</h4>
							<p className="text-sm text-gray-700"><span className="font-medium">Nama:</span> {detail.name}</p>
							<p className="text-sm text-gray-700"><span className="font-medium">Tanggal:</span> {detail.date.toLocaleDateString()}</p>
							{modalType === 'tour' && (
								<p className="text-sm text-gray-700"><span className="font-medium">Lokasi Penjemputan:</span> {detail.pickupLocation}</p>
							)}
							<p className="text-sm text-gray-700"><span className="font-medium">Telepon:</span> {detail.phone}</p>
							{detail.specialRequests && (
								<p className="text-sm text-gray-700"><span className="font-medium">Permintaan Khusus:</span> {detail.specialRequests}</p>
							)}
						</div>
					))}
				</div>
				<div className="mt-4 p-4 bg-havanaBlue/10 rounded-lg text-sm font-semibold text-havanaBlue">
					<p>Total Biaya: {activeCurrency?.code || 'IDR'} {booking.totalPrice.toLocaleString()}</p>
				</div>
				<div className="flex justify-end mt-6">
					<button onClick={closeModal} className="py-2 px-4 bg-havanaBlue text-white rounded-md text-sm font-semibold hover:bg-blue-700">
						Tutup
					</button>
				</div>
			</div>
		</div>
	);
};

// Komponen utama yang menangani proses pemesanan detail.
// Ini adalah modal checkout Anda.

function DetailBookModal({
	isOpen,
	closeModal,
	closeParentModal,
	selectedItem,
	modalType,
	activeCurrency,
	BACKEND_URL,
	user,
	authToken,
	openTicketModal,
}) {
	// Menentukan status awal untuk setiap detail tiket.
	const today = new Date();
	const minDate = new Date(today);
	minDate.setDate(today.getDate() + 7);

	const maxTickets = 5;

	const initialDetail = {
		name: '', // Bidang baru untuk nama pelanggan
		date: minDate,
		pickupLocation: '',
		phone: '',
		specialRequests: '',
	};

	// State untuk semua detail tiket.
	const [details, setDetails] = useState(
		Array(maxTickets).fill().map(() => ({ ...initialDetail }))
	);
	// State untuk jumlah tiket yang ingin dipesan.
	const [ticketCount, setTicketCount] = useState(1);
	// State untuk menentukan apakah semua tiket menggunakan detail yang sama.
	const [useSameDetails, setUseSameDetails] = useState(true);
	// State untuk mengelola tab tiket yang sedang aktif.
	const [activeTab, setActiveTab] = useState(0);
	// State untuk menampilkan pesan error.
	const [error, setError] = useState('');
	// State untuk menonaktifkan tombol selama proses submit.
	const [isSubmitting, setIsSubmitting] = useState(false);
	// State untuk membuka modal konfirmasi.
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
	// State untuk membuka modal validasi sebelum submit final.
	const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
	// State untuk menyimpan data pemesanan yang berhasil.
	const [confirmedBooking, setConfirmedBooking] = useState(null);

	// Menghitung total harga berdasarkan jumlah tiket.
	const totalPrice = selectedItem?.price ? selectedItem.price * ticketCount : 0;

	// Reset status modal setiap kali dibuka.
	useEffect(() => {
		if (isOpen) {
			console.log('🧾 DetailBookModal Open:', isOpen);
			console.log('🔐 User:', user);
			console.log('🔑 AuthToken:', authToken);
			console.log('🧭 Selected Item:', selectedItem);
			console.log('💱 Currency:', activeCurrency);
			
			// Mengatur ulang detail, jumlah tiket, dan status UI.
			setDetails(
				Array(maxTickets).fill().map(() => ({
					...initialDetail,
					phone: user?.phone || '',
				}))
			);
			setTicketCount(1);
			setActiveTab(0);
			setUseSameDetails(true);
			setError('');
		}
	}, [isOpen, user?.phone, selectedItem, activeCurrency]);

	// Fungsi helper untuk memperbarui state detail.
	const updateDetailsState = useCallback((key, value) => {
		setDetails((prev) => {
			const newDetails = [...prev];
			newDetails[activeTab] = { ...newDetails[activeTab], [key]: value };
			if (useSameDetails) {
				// Jika menggunakan detail yang sama, terapkan perubahan ke semua tiket aktif.
				return newDetails.map((d, index) =>
					index < ticketCount ? { ...d, [key]: value } : d
				);
			}
			return newDetails;
		});
	}, [activeTab, useSameDetails, ticketCount]);

	// Menangani perubahan input teks.
	const handleInputChange = (e) => {
		const { name, value } = e.target;
		updateDetailsState(name, value);
	};

	// Menangani perubahan tanggal dari DatePicker.
	const handleDateChange = (date) => {
		updateDetailsState('date', date);
	};

	// Memeriksa apakah detail satu tiket sudah lengkap.
	const isDetailComplete = (detail) => {
		const nameIsValid = !!detail.name && detail.name.trim() !== '';
		const phoneIsValid = detail.phone && detail.phone.match(/^\+?[1-9]\d{7,14}$/);
		const dateIsValid = !!detail.date;
		const pickupLocationIsValid = modalType !== 'tour' || (!!detail.pickupLocation && detail.pickupLocation.trim() !== '');
		return nameIsValid && dateIsValid && phoneIsValid && pickupLocationIsValid;
	};

	// Memeriksa apakah detail semua tiket aktif sudah lengkap.
	const allDetailsComplete = () => {
		return details.slice(0, ticketCount).every(isDetailComplete);
	};

	// --- Alur Checkout Dimulai di Sini ---

	// Menangani submit form utama.
	const handleSubmit = (e) => {
		e.preventDefault();
		console.log('📦 Booking Data:', { ticketCount, details: details.slice(0, ticketCount) });
		if (!allDetailsComplete()) {
			setError('Silakan lengkapi semua detail untuk setiap tiket.');
			return;
		}
		// Langkah 1: Membuka modal validasi untuk konfirmasi.
		setIsValidationModalOpen(true);
	};

	// Menangani konfirmasi dari modal validasi.
	const handleValidationConfirm = async () => {
		setIsSubmitting(true);
		setError('');
		console.log('🚀 Memulai konfirmasi validasi');

		if (!user?.id || !authToken) {
			console.warn('🚫 Pengguna tidak login atau token autentikasi hilang.');
			setError('Silakan login untuk memesan.');
			setIsSubmitting(false);
			setIsValidationModalOpen(false);
			return;
		}
		if (!selectedItem?._id || !selectedItem?.price) {
			console.error('❌ Data item yang dipilih tidak valid:', selectedItem);
			setError('Data item tidak valid. Silakan coba lagi.');
			setIsSubmitting(false);
			setIsValidationModalOpen(false);
			return;
		}

		try {
			// Langkah 2: Mengirim payload ke API backend.
			const payload = {
				userId: user.id,
				itemId: selectedItem._id,
				itemType: modalType,
				details: details.slice(0, ticketCount).map((d) => ({
					name: d.name,
					date: d.date.toISOString(),
					pickupLocation: d.pickupLocation || undefined,
					phone: d.phone,
					specialRequests: d.specialRequests || undefined,
				})),
				ticketCount,
				currency: activeCurrency?.code || 'IDR',
				price: selectedItem.price,
			};

			console.log('📤 Mengirim payload:', payload);

			const response = await axios.post(
				`${BACKEND_URL}/api/bookings`,
				payload,
				{ headers: { Authorization: `Bearer ${authToken}` } }
			);

			console.log('✅ Respon pemesanan:', response.data);

			// Mempersiapkan data untuk modal konfirmasi.
			const newBooking = {
				itemName: modalType === 'ticket' ? selectedItem.destination?.name : selectedItem.name,
				details: details.slice(0, ticketCount).map((d) => ({
					name: d.name,
					date: d.date,
					pickupLocation: d.pickupLocation,
					phone: d.phone,
					specialRequests: d.specialRequests,
				})),
				ticketCount,
				price: selectedItem.price,
				totalPrice: selectedItem.price * ticketCount,
				currency: activeCurrency?.code || 'IDR',
			};

			console.log('📊 Mengatur confirmedBooking:', newBooking);
			setConfirmedBooking(newBooking);
			// Langkah 3: Jika berhasil, tutup modal validasi dan buka modal konfirmasi.
			setIsValidationModalOpen(false);
			setIsConfirmModalOpen(true);

			// Mengatur ulang formulir setelah pemesanan berhasil.
			setDetails(
				Array(maxTickets).fill().map(() => ({
					...initialDetail,
					phone: user?.phone || '',
				}))
			);
			setTicketCount(1);
		} catch (err) {
			console.error('❌ Error pemesanan:', err);
			console.error('📨 Respon error dari server:', err.response?.data, err.response?.status);
			setError(err.response?.data?.message || 'Gagal membuat pemesanan');
			setIsValidationModalOpen(false); // Tutup modal validasi jika ada error
		} finally {
			setIsSubmitting(false);
			console.log('🏁 Konfirmasi validasi selesai');
		}
	};

	// --- Akhir Alur Checkout ---

	const ticketOptions = [1, 2, 3, 4, 5];

	return (
		<>
			<AnimatePresence>
				{isOpen && (
					<motion.div
						className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10003]"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={closeModal}
					>
						<motion.div
							className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-2 p-6 max-h-[90vh] overflow-y-auto"
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							transition={{ duration: 0.3 }}
							onClick={(e) => e.stopPropagation()}
						>
							<h3 className="text-xl font-bold text-havanaGray mb-4">
								Pesan {modalType === 'ticket' ? selectedItem.destination?.name : selectedItem.name}
							</h3>
							{error && <p className="text-red-500 text-sm mb-4">{error}</p>}
							<div className="mb-4 flex items-center">
								<input
									type="checkbox"
									id="useSameDetailsCheckbox"
									checked={useSameDetails}
									onChange={() => setUseSameDetails(!useSameDetails)}
									className="mr-2 h-4 w-4 text-havanaBlue rounded border-gray-300 focus:ring-havanaBlue"
								/>
								<label htmlFor="useSameDetailsCheckbox" className="text-sm text-gray-700">
									Gunakan detail yang sama untuk semua tiket
								</label>
							</div>
							<div className="grid grid-cols-1 gap-4 mb-6">
								<div>
									<h4 className="text-base font-semibold text-havanaGray">Detail Harga</h4>
									<p className="text-havanaGray text-sm">
										<span className="font-medium">Harga per Tiket:</span>{' '}
										{activeCurrency?.code || 'IDR'} {selectedItem.price?.toLocaleString() || 'N/A'}
									</p>
									<p className="text-havanaGray text-sm">
										<span className="font-medium">Total Harga:</span>{' '}
										{activeCurrency?.code || 'IDR'} {totalPrice.toLocaleString()}
									</p>
								</div>
								<div>
									<label className="block text-sm font-medium text-havanaGray mb-2">
										Jumlah Tiket
									</label>
									<div className="flex space-x-2">
										{ticketOptions.map((count) => (
											<button
												key={count}
												type="button"
												onClick={() => setTicketCount(count)}
												className={`py-2 px-4 rounded-md text-sm font-semibold border transition-colors ${
													ticketCount === count
														? 'bg-havanaBlue text-white border-havanaBlue'
														: 'bg-white text-havanaGray border-gray-300 hover:bg-gray-100'
												}`}
											>
												{count}
											</button>
										))}
									</div>
									<p className="text-havanaGray text-xs mt-1">Maks {maxTickets} tiket</p>
								</div>
							</div>
							{!useSameDetails && ticketCount > 1 && (
								<div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
									{Array.from({ length: ticketCount }).map((_, index) => (
										<button
											key={index}
											onClick={() => setActiveTab(index)}
											className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
												activeTab === index
													? 'bg-havanaBlue text-white'
													: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
											}`}
										>
											Tiket {index + 1}
											{isDetailComplete(details[index]) && (
												<BiCheck className="ml-2 text-green-400" />
											)}
										</button>
									))}
								</div>
							)}
							<form onSubmit={handleSubmit} className="space-y-4">
								<motion.div
									key={activeTab}
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -20 }}
									transition={{ duration: 0.2 }}
								>
									<div>
										<label htmlFor="customerName" className="block text-sm font-medium text-havanaGray flex items-center">
											<BiUser className="mr-2" /> Nama Anda
										</label>
										<input
											type="text"
											id="customerName"
											name="name"
											value={details[activeTab].name}
											onChange={handleInputChange}
											className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue text-sm p-2"
											placeholder="cth., Jane Doe"
											required
										/>
									</div>
									<div>
										<label htmlFor="bookingDate" className="block text-sm font-medium text-havanaGray flex items-center">
											<BiCalendar className="mr-2" /> Tanggal Pemesanan
										</label>
										<DatePicker
											id="bookingDate"
											selected={details[activeTab].date}
											onChange={handleDateChange}
											minDate={minDate}
											className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue text-sm p-2"
											dateFormat="MMMM d, yyyy"
											required
										/>
									</div>
									{modalType === 'tour' && (
										<div>
											<label htmlFor="pickupLocation" className="block text-sm font-medium text-havanaGray flex items-center">
												<BiMapPin className="mr-2" /> Lokasi Penjemputan
											</label>
											<input
												type="text"
												id="pickupLocation"
												name="pickupLocation"
												value={details[activeTab].pickupLocation}
												onChange={handleInputChange}
												className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue text-sm p-2"
												placeholder="cth., Lobby Hotel, Jl. Contoh No. 123"
												required
											/>
										</div>
									)}
									<div>
										<label htmlFor="contactPhone" className="block text-sm font-medium text-havanaGray flex items-center">
											<BiPhone className="mr-2" /> Telepon Kontak
										</label>
										<input
											type="tel"
											id="contactPhone"
											name="phone"
											value={details[activeTab].phone}
											onChange={handleInputChange}
											className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue text-sm p-2"
											placeholder="+6281234567890"
											required
										/>
									</div>
									<div>
										<label htmlFor="specialRequests" className="block text-sm font-medium text-havanaGray flex items-center">
											<BiNote className="mr-2" /> Permintaan Khusus
										</label>
										<textarea
											id="specialRequests"
											name="specialRequests"
											value={details[activeTab].specialRequests}
											onChange={handleInputChange}
											className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue text-sm p-2"
											rows="3"
											placeholder="cth., Makanan vegetarian, akses kursi roda"
										/>
									</div>
								</motion.div>
								<div className="flex justify-end space-x-2">
									<button
										type="button"
										onClick={closeModal}
										className="py-2 px-4 bg-havanaPink text-white rounded-md text-sm font-semibold hover:bg-pink-700 transition-colors"
										disabled={isSubmitting}
									>
										Batal
									</button>
									<button
										type="submit"
										className="py-2 px-4 bg-havanaBlue text-white rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
										disabled={isSubmitting || !allDetailsComplete()}
									>
										{isSubmitting ? 'Mengirim...' : 'Konfirmasi Pemesanan'}
									</button>
								</div>
							</form>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			<ValidationModal
				isOpen={isValidationModalOpen}
				closeModal={() => {
					console.log('🔐 Menutup ValidationModal');
					setIsValidationModalOpen(false);
				}}
				onConfirm={() => {
					console.log('🖱️ Tombol Konfirmasi ValidationModal diklik');
					handleValidationConfirm();
				}}
				isSubmitting={isSubmitting}
			/>

			<DetailConfirmBookingModal
				isOpen={isConfirmModalOpen}
				closeModal={() => {
					console.log('🔐 Menutup DetailConfirmBookingModal');
					setIsConfirmModalOpen(false);
					closeParentModal();
				}}
				booking={confirmedBooking}
				modalType={modalType}
				activeCurrency={activeCurrency}
				openTicketModal={openTicketModal}
			/>
		</>
	);
}

export default DetailBookModal;
