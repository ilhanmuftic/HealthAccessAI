import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useHospital } from "@/hooks/use-hospital";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChatWidget } from "@/components/chat/chat-widget";
import {
  CalendarPlus,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock3,
  Building2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { supabase } from "@/../utils/supabaseClient";
import { useAuth } from "@/hooks/use-auth";

const appointmentStatusMap: Record<string, string[]> = {
  upcoming: ["pending", "approved"],
  completed: ["completed"],
  cancelled: ["cancelled"],
};

export const fetchDoctorAppointments = async (
  doctorId: string,
  tab: string,
  date: Date,
  hospitalId?: number | null
) => {
  const selectedDate = format(date, "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("doctor_appointments_view")
    .select("*")
    .eq("doctor_id", String(doctorId))
    .eq("hospital_id", hospitalId ?? null)
    .in("status", appointmentStatusMap[tab] || [])
    .gte("date", `${selectedDate}T00:00:00`)
    .lt("date", `${selectedDate}T23:59:59`);

  if (error) {
    console.error("Failed to fetch appointments:", error);
    throw error;
  }

  return data;
};

export default function DoctorAppointments() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [tab, setTab] = useState("upcoming");
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentDuration, setAppointmentDuration] = useState("30");

  const { user } = useAuth();
  const { selectedHospital } = useHospital();

  const { data: appointments, isLoading } = useQuery({
    queryKey: [
      "/api/doctor/appointments",
      tab,
      date ? format(date, "yyyy-MM-dd") : null,
      selectedHospital,
      user?.id,
    ],
    queryFn: () =>
      fetchDoctorAppointments(user?.id, tab, date!, selectedHospital),
    enabled: !!user?.id && !!selectedHospital && !!date,
  });

  const { data: patients } = useQuery({
    queryKey: ["/api/doctor/patients/all", selectedHospital],
    queryFn: async () => {
      const url = selectedHospital
        ? `/api/doctor/patients/all?hospitalId=${selectedHospital}`
        : "/api/doctor/patients/all";
      return apiRequest(url);
    },
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-blue-500">Pending</Badge>;
      case "approved":
        return <Badge className="bg-indigo-500">Approved</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "cancelled":
        return (
          <Badge variant="outline" className="text-red-500 border-red-500">
            Cancelled
          </Badge>
        );
      case "no-show":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            No Show
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
      case "approved":
        return <Clock3 className="h-5 w-5 text-blue-500" />;
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "no-show":
        return <XCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <Clock3 className="h-5 w-5" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold font-heading">Appointments</h1>
          <Button onClick={() => setIsNewAppointmentOpen(true)}>
            <CalendarPlus className="mr-2 h-4 w-4" /> New Appointment
          </Button>
        </div>

        {selectedHospital && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-muted/20 rounded-md">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">
              Currently viewing: {selectedHospital.name} (
              {selectedHospital.type}) - {selectedHospital.municipality}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle>Appointment Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold">
                      {date ? format(date, "MMMM d, yyyy") : "Select a date"}
                    </h3>
                  </div>

                  {isLoading ? (
                    <div className="space-y-4">
                      {Array(4)
                        .fill(0)
                        .map((_, i) => (
                          <div
                            key={i}
                            className="flex items-start p-4 border rounded-lg"
                          >
                            <Skeleton className="h-10 w-10 rounded-full mr-4" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-[200px]" />
                              <Skeleton className="h-4 w-[150px]" />
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {appointments && appointments.length > 0 ? (
                        appointments.map((appointment: any) => (
                          <div
                            key={appointment.id}
                            className="flex p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50"
                          >
                            <div className="mr-3">
                              {getStatusIcon(appointment.status)}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <p className="font-medium">
                                  {format(new Date(appointment.date), "h:mm a")}{" "}
                                  -{" "}
                                  {format(
                                    new Date(
                                      new Date(appointment.date).getTime() +
                                        appointment.duration * 60000
                                    ),
                                    "h:mm a"
                                  )}
                                </p>
                                {getStatusBadge(appointment.status)}
                              </div>
                              <div className="flex items-center mt-1">
                                {/* <Avatar className="h-6 w-6 mr-2">
                                  <AvatarImage
                                  // src={appointment.patient.avatarUrl}
                                  />
                                  <AvatarFallback>
                                    {getInitials(
                                      appointment.patient.firstName,
                                      appointment.patient.lastName
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <p className="text-sm text-neutral-600">
                                  {`${appointment.patient.firstName} ${appointment.patient.lastName}`}{" "}
                                  - {appointment.title}
                                </p> */}
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarImage
                                    src={appointment.patient_avatar_url}
                                  />
                                  <AvatarFallback>
                                    {getInitials(
                                      appointment.patient_first_name || "?",
                                      appointment.patient_last_name || "?"
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <p className="text-sm text-neutral-600">
                                  {`${
                                    appointment.patient_first_name ?? "Unknown"
                                  } ${
                                    appointment.patient_last_name ?? ""
                                  }`}{" "}
                                  - {appointment.title}
                                </p>
                              </div>
                              {appointment.description && (
                                <p className="text-xs text-neutral-500 mt-1">
                                  {appointment.description}
                                </p>
                              )}
                              {appointment.status === "scheduled" && (
                                <div className="flex space-x-2 mt-2">
                                  <Button variant="outline" size="sm">
                                    Reschedule
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500 border-red-500 hover:bg-red-50"
                                  >
                                    Cancel
                                  </Button>
                                  <Button size="sm">Start Appointment</Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-neutral-500">
                          No appointments{" "}
                          {tab === "upcoming" ? "scheduled" : tab} for this date
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Appointment Dialog */}
      <Dialog
        open={isNewAppointmentOpen}
        onOpenChange={setIsNewAppointmentOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule New Appointment</DialogTitle>
            <DialogDescription>
              Create a new appointment for a patient.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="patient">Patient</Label>
              <Select
                value={selectedPatient}
                onValueChange={setSelectedPatient}
              >
                <SelectTrigger id="patient">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients &&
                    patients.map((patient: any) => (
                      <SelectItem key={patient.id} value={String(patient.id)}>
                        {`${patient.firstName} ${patient.lastName}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Appointment Title</Label>
              <Input id="title" placeholder="e.g. Follow-up visit" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <DayPicker
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="time">Time</Label>
                <Select
                  value={appointmentTime}
                  onValueChange={setAppointmentTime}
                >
                  <SelectTrigger id="time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
                      <>
                        <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                          {`${hour > 12 ? hour - 12 : hour}:00 ${
                            hour >= 12 ? "PM" : "AM"
                          }`}
                        </SelectItem>
                        <SelectItem key={`${hour}:30`} value={`${hour}:30`}>
                          {`${hour > 12 ? hour - 12 : hour}:30 ${
                            hour >= 12 ? "PM" : "AM"
                          }`}
                        </SelectItem>
                      </>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="duration">Duration</Label>
              <Select
                value={appointmentDuration}
                onValueChange={setAppointmentDuration}
              >
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about the appointment"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewAppointmentOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              <Clock className="mr-2 h-4 w-4" />
              Schedule Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChatWidget role="doctor" />
    </DashboardLayout>
  );
}
