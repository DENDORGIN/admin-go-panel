import { useDisclosure } from "@chakra-ui/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { CalendarEventsService } from "../../client"
import type { CalendarEventCreate, CalendarEventPublic } from "../../client"
import AddEventModal from "./AddEventModal"
import "./Calendar.css"
import useCustomToast from "../../hooks/useCustomToast";

const Calendar = () => {
  const [events, setEvents] = useState<CalendarEventPublic[]>([])
  const [selectedDate, setSelectedDate] = useState(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const showToast = useCustomToast()

  // Fetching events from API
  const { data: fetchedEvents, isLoading, refetch } = useQuery<CalendarEventPublic[]>({
    queryKey: ["calendarEvents"],
    queryFn: CalendarEventsService.readCalendarEvents,
  })

  // Formatting events
  useEffect(() => {
    if (fetchedEvents) {
      const formattedEvents = fetchedEvents.map((event) => ({
        id: event.ID,
        title: data.title,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        allDay: selectedDate.allDay,
        description: data.description,
        color: data.color || null,
        user_id: string,
        workingDay: data.eventType === "workingDay",
        sickDay: data.eventType === "sickDay",
        vacation: data.eventType === "vacation",
        weekend: data.eventType === "weekend",
      }))
      // @ts-ignore
      setEvents(formattedEvents)
    }
  }, [fetchedEvents])

  // Mutation for adding a new event
  const mutation = useMutation({
    mutationFn: (newEvent: CalendarEventCreate) =>
      CalendarEventsService.createCalendarEvent(newEvent),
    onSuccess: (createdEvent: CalendarEventPublic) => {
      setEvents((prevEvents) => [...prevEvents, createdEvent])
      refetch().then()
    },
  })

  // Handling date selection for new events
  const handleDateSelect = (selectInfo: any) => {
    setSelectedDate({
      startStr: selectInfo.startStr,
      endStr: selectInfo.endStr,
      allDay: selectInfo.allDay,
    });
    onOpen();
  };

  // Handling event addition
  const handleEventAdd = (newEvent: CalendarEventCreate) => {
    mutation.mutate(newEvent)
    onClose()
  }

  // Handling event click for deletion
  const handleEventClick = (clickInfo: any) => {
    if (window.confirm(`Delete event '${clickInfo.event.title}'?`)) {
      const eventId = clickInfo.event.id
      setEvents((prevEvents) =>
        prevEvents.filter((event) => event.ID !== eventId),
      )
      CalendarEventsService.deleteCalendarEvent(eventId).then(() => refetch())
      showToast("Deleted!", "Event deleted successfully.", "success")
    }
  }

  if (isLoading) {
    return <div>Loading calendar...</div>
  }

  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        editable={true}
        selectable={true}
        // @ts-ignore
        events={events}
        select={handleDateSelect}
        eventClick={handleEventClick}
        height="auto"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
      />
      <AddEventModal
        isOpen={isOpen}
        onClose={onClose}
        onAddEvent={handleEventAdd}
        selectedDate={selectedDate}
      />
    </div>
  )
}

export default Calendar
